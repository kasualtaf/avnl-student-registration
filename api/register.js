import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { form, recaptchaToken } = req.body;

  // 1. Verify reCAPTCHA
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) return res.status(500).json({ error: "Server misconfiguration: missing reCAPTCHA key" });

  try {
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    const recaptchaRes = await fetch(verifyURL, { method: 'POST' });
    const recaptchaData = await recaptchaRes.json();
    
    // Some local development tokens might bypass score, but generally we want >= 0.5
    if (!recaptchaData.success || (recaptchaData.score !== undefined && recaptchaData.score < 0.5)) {
      console.warn("reCAPTCHA failed:", recaptchaData);
      return res.status(400).json({ error: "reCAPTCHA verification failed. Please try again or disable VPN." });
    }
  } catch (err) {
    console.error("reCAPTCHA error:", err);
    return res.status(500).json({ error: "Failed to verify reCAPTCHA." });
  }

  // 2. Validate required fields
  if (!form.fullName || !form.email || !form.mobile || !form.courseCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // 3. Duplicate check via DB
  const { data: existing, error: searchError } = await supabase
    .from("students")
    .select("id")
    .or(`email.eq.${form.email},mobile_number.eq.${form.mobile}`);

  if (searchError) {
    console.error("Supabase search error:", searchError);
  }

  if (existing && existing.length > 0) {
    return res.status(400).json({ error: "You have already registered. Email or Mobile number already exists." });
  }

  // 4. Insert into Supabase
  const newId = randomUUID();
  const regId = newId.split('-')[0].toUpperCase();

  const { error: insertError } = await supabase.from("students").insert([{
    id: newId,
    full_name: form.fullName,
    email: form.email,
    mobile_number: form.mobile,
    city: form.city || null,
    course_code: form.courseCode,
    course_name: form.courseName || '',
    whatsapp_number: form.whatsapp || null,
    status: 'Pending',
    source: 'Website',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }]);

  if (insertError) {
    if (insertError.code === '23505') { // Unique violation code in Postgres
       return res.status(400).json({ error: "You have already registered. (Duplicate constraint)" });
    }
    console.error("Insert Error:", insertError);
    return res.status(500).json({ error: "Database error during registration." });
  }

  // 5. Fire off email & SMS asynchronously (without awaiting their completion to speed up client response)
  // We can make internal network requests to our own API endpoints if hosted on Vercel,
  // but it's simpler to just do the fetch here.
  
  // Call Fast2SMS
  if (process.env.FAST2SMS_API_KEY) {
    fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": process.env.FAST2SMS_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        route: "q",
        message: "Thank you for registering with AVNL. Your registration has been received successfully.",
        language: "english",
        flash: 0,
        numbers: form.mobile
      })
    }).catch(e => console.error("Fast2SMS async error:", e));
  }

  // Call EmailJS
  const serviceId = process.env.VITE_EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID;
  if (serviceId) {
    const emailjs = require('@emailjs/nodejs');
    emailjs.send(
      serviceId,
      process.env.VITE_EMAILJS_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID,
      {
        full_name: form.fullName,
        email: form.email,
        course_code: form.courseCode,
        course_name: form.courseName || '',
        registration_id: regId
      },
      {
        publicKey: process.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY || ''
      }
    ).catch(e => console.error("EmailJS async error:", e));
  }

  return res.status(200).json({ 
    success: true, 
    message: "Registration successful", 
    registrationId: regId 
  });
}
