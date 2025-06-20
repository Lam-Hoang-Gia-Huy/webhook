const express = require("express");
const app = express();
const fs = require("fs"); // Import fs ở đây để dùng được

app.use(express.json()); // Parse JSON payloads

app.post("/api/webhook", (req, res) => {
  const payload = req.body;
  console.log("Received Zalo webhook:", payload);

  // Process the webhook payload
  try {
    const eventName = payload.event_name;
    if (eventName !== "user_send_text") {
      console.log(`Ignoring event: ${eventName}`);
      return res.status(200).json({ status: "ignored" });
    }

    const appId = payload.app_id;
    const userId = payload.user_id;
    const message = payload.message;
    const msgId = message.msg_id;
    const text = message.text;
    const timestamp = message.timestamp;

    // Log or save the message
    console.log(
      `App ID: ${appId}, User ID: ${userId}, Message ID: ${msgId}, Text: ${text}, Timestamp: ${timestamp}`
    );

    // Save to a file for NewFeatureApp to read
    const logEntry = `App ID: ${appId}\nUser ID: ${userId}\nMessage ID: ${msgId}\nNội dung: ${text}\nThời gian: ${timestamp}\n-------------------\n`;
    fs.appendFileSync("webhook_log.txt", logEntry);

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

// KHÔNG ĐẶT app.listen() TRONG ROUTE!
// Di chuyển app.listen() ra ngoài, ở cuối file
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));

module.exports = app; // Bạn có thể export app nếu muốn sử dụng nó cho các mục đích khác (ví dụ: test)
