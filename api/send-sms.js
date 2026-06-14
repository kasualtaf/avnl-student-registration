// api/send-sms.js
const twilio = require("twilio");

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone, courseName } = req.body;

  if (!phone || !courseName) {
    return res.status(400).json({ error: "Phone number and course name are required" });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !twilioPhoneNumber) {
    return res.status(500).json({ error: "Twilio credentials are not configured" });
  }

  try {
    const client = twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: `Hello, you registered in the course ${courseName}. Thank you for choosing AVNL!`,
      from: twilioPhoneNumber,
      to: phone,
    });

    return res.status(200).json({ success: true, messageId: message.sid });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({ error: "Failed to send SMS", details: error.message });
  }
}
