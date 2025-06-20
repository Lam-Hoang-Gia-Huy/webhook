const express = require("express");
const app = express();

app.use(express.json()); // Parse JSON payloads

app.post("/api/webhook", (req, res) => {
  const payload = req.body;
  console.log("Received Zalo webhook:", JSON.stringify(payload, null, 2));

  // Check if payload is undefined
  if (!payload) {
    console.error("Payload is undefined");
    return res
      .status(400)
      .json({ status: "error", message: "No payload provided" });
  }

  // Process the webhook payload
  try {
    const eventName = payload.event_name;
    if (!eventName) {
      console.error("event_name is missing in payload");
      return res
        .status(400)
        .json({ status: "error", message: "Missing event_name" });
    }

    if (eventName !== "user_send_text") {
      console.log(`Ignoring event: ${eventName}`);
      return res.status(200).json({ status: "ignored" });
    }

    const appId = payload.app_id;
    const userId = payload.user_id;
    const message = payload.message;
    if (!message) {
      console.error("message object is missing in payload");
      return res
        .status(400)
        .json({ status: "error", message: "Missing message object" });
    }

    const msgId = message.msg_id;
    const text = message.text;
    const timestamp = message.timestamp;

    if (!msgId || !text || !timestamp) {
      console.error("Missing required message fields");
      return res
        .status(400)
        .json({ status: "error", message: "Missing required message fields" });
    }

    // Log to console (Vercel-compatible)
    console.log(
      `App ID: ${appId}, User ID: ${userId}, Message ID: ${msgId}, Text: ${text}, Timestamp: ${timestamp}`
    );

    // Respond to Zalo
    res.status(200).json({
      status: "received",
      msg_id: msgId,
      user_id: userId,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = app; // Export for Vercel
