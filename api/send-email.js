import emailjs from '@emailjs/nodejs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { full_name, email, course_code, course_name, registration_id } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ error: 'Missing required fields for email' });
  }

  const serviceId = process.env.VITE_EMAILJS_SERVICE_ID || process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.VITE_EMAILJS_TEMPLATE_ID || process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.VITE_EMAILJS_PUBLIC_KEY || process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY || ''; // Optional but recommended

  if (!serviceId || !templateId || !publicKey) {
    console.error("Missing EmailJS credentials");
    return res.status(500).json({ error: 'Server misconfiguration: EmailJS keys missing' });
  }

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        full_name,
        email,
        course_code,
        course_name,
        registration_id
      },
      {
        publicKey,
        privateKey
      }
    );
    return res.status(200).json({ success: true, message: 'Email sent successfully', response });
  } catch (error) {
    console.error("EmailJS backend error:", error);
    return res.status(500).json({ error: "Failed to send email", details: error.message });
  }
}
