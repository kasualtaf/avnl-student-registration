// api/register.js – Student registration endpoint.
// Server-side only. Requires Vercel env vars:
//   SUPABASE_URL or VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY
//   RECAPTCHA_SECRET_KEY
//   UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (enforced by middleware.js)
//   EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY
//   FAST2SMS_API_KEY (optional)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const RECAPTCHA_MIN_SCORE = 0.5;
const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : process.env.NEXT_PUBLIC_BASE_URL || '';

// Build an AVNL-YYYY-NNNN id by counting prior rows for the current year.
async function generateRegistrationId() {
  const year = new Date().getUTCFullYear();
  const yearStart = `${year}-01-01T00:00:00Z`;
  const { count, error } = await supabase
    .from('students')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', yearStart);

  if (error) {
    console.error('Failed to count students for registration id:', error);
    // Fall back to a timestamp-derived suffix so we still produce a unique id.
    const fallback = Date.now().toString().slice(-4);
    return `AVNL-${year}-${fallback}`;
  }

  const sequence = String((count || 0) + 1).padStart(4, '0');
  return `AVNL-${year}-${sequence}`;
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

async function postJson(url, body) {
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error(`Async POST to ${url} failed:`, err);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { form, recaptchaToken } = req.body || {};

  // 1. Verify reCAPTCHA v3.
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    return res
      .status(500)
      .json({ error: 'Server misconfiguration: missing reCAPTCHA key' });
  }
  if (!recaptchaToken) {
    return badRequest(res, 'reCAPTCHA token is required.');
  }

  try {
    const verifyURL = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaToken}`;
    const recaptchaRes = await fetch(verifyURL, { method: 'POST' });
    const recaptchaData = await recaptchaRes.json();

    if (!recaptchaData.success) {
      console.warn('reCAPTCHA failed:', recaptchaData);
      return badRequest(
        res,
        'reCAPTCHA verification failed. Please try again or disable VPN.'
      );
    }
    if (
      typeof recaptchaData.score === 'number' &&
      recaptchaData.score < RECAPTCHA_MIN_SCORE
    ) {
      console.warn('reCAPTCHA low score:', recaptchaData.score);
      return badRequest(
        res,
        'reCAPTCHA score too low. Please try again or disable VPN.'
      );
    }
  } catch (err) {
    console.error('reCAPTCHA error:', err);
    return res
      .status(500)
      .json({ error: 'Failed to verify reCAPTCHA.' });
  }

  // 2. Validate required fields.
  if (
    !form ||
    !form.fullName ||
    !form.email ||
    !form.mobile ||
    !form.courseCode
  ) {
    return badRequest(res, 'Missing required fields');
  }

  // 3. Duplicate check via DB (defence-in-depth; UNIQUE constraint also enforces).
  const { data: existing, error: searchError } = await supabase
    .from('students')
    .select('id')
    .or(`email.eq.${form.email},mobile_number.eq.${form.mobile}`)
    .limit(1);

  if (searchError) {
    console.error('Supabase search error:', searchError);
  }
  if (existing && existing.length > 0) {
    return badRequest(
      res,
      'You have already registered. Email or Mobile number already exists.'
    );
  }

  // 4. Generate spec-compliant registration id and insert.
  const registrationId = await generateRegistrationId();

  const { error: insertError } = await supabase.from('students').insert([
    {
      registration_id: registrationId,
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
      updated_at: new Date().toISOString(),
    },
  ]);

  if (insertError) {
    if (insertError.code === '23505') {
      return badRequest(
        res,
        'You have already registered. (Duplicate constraint)'
      );
    }
    console.error('Insert Error:', insertError);
    return res
      .status(500)
      .json({ error: 'Database error during registration.' });
  }

  // 5. Fire-and-forget notifications. Use the dedicated /api/send-email endpoint
  //    (and the internal SMS helper) so all third-party API calls live in one
  //    server-only place.
  postJson(`${BASE_URL}/api/send-email`, {
    full_name: form.fullName,
    email: form.email,
    course_code: form.courseCode,
    course_name: form.courseName || '',
    registration_id: registrationId,
  });

  if (process.env.FAST2SMS_API_KEY) {
    fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        authorization: process.env.FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message: `Thank you for registering with AVNL. Your Registration ID is ${registrationId}.`,
        language: 'english',
        flash: 0,
        numbers: form.mobile,
      }),
    }).catch((e) => console.error('Fast2SMS async error:', e));
  }

  return res.status(200).json({
    success: true,
    message: 'Registration successful',
    registrationId,
  });
}
