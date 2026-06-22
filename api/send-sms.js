// api/send-sms.js

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: "Fast2SMS API key is not configured" });
  }

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        route: "q",
        message: "Thank you for registering with AVNL. Your registration has been received successfully.",
        language: "english",
        flash: 0,
        numbers: phone
      })
    });

    const data = await response.json();

    if (!response.ok || !data.return) {
      throw new Error(data.message || "Failed to send SMS via Fast2SMS");
    }

    return res.status(200).json({ success: true, messageId: data.request_id });
  } catch (error) {
    console.error("Error sending SMS:", error);
    return res.status(500).json({ error: "Failed to send SMS", details: error.message });
  }
}
