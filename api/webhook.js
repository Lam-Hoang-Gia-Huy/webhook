const express = require("express");
const app = express();
const fs = require("fs");

app.use(express.json());

// Lưu tin nhắn mới vào file tạm
app.post("/api/webhook", (req, res) => {
  const payload = req.body;
  console.log("Received Zalo webhook:", JSON.stringify(payload, null, 2));

  // Trả về 200 OK ngay lập tức
  res.status(200).json({ status: "received" });

  if (!payload) {
    console.log("No payload provided");
    return;
  }

  try {
    const eventName = payload["event_name"];
    if (!eventName || eventName !== "user_send_text") {
      console.log(`Ignoring event: ${eventName || "undefined"}`);
      return;
    }

    const senderId = payload.sender?.id || null;
    const userId = payload.user_id_by_app || null;
    const { msg_id: messageId, text } = payload.message || {};
    const timestamp = payload.timestamp ? parseInt(payload.timestamp) : null;

    if (!messageId || !text || !timestamp) {
      console.log("Missing required message fields:", {
        messageId,
        text,
        timestamp,
      });
      return;
    }

    // Lưu tin nhắn vào file tạm
    const messageData = {
      senderId,
      userId,
      messageId,
      text,
      timestamp,
    };
    fs.writeFileSync(
      "latest_zalo_message.txt",
      JSON.stringify(messageData, null, 2),
      "utf8"
    );
    console.log("Saved new message to latest_zalo_message.txt");
  } catch (error) {
    console.error("Error processing webhook:", error);
  }
});

app.get("/api/webhook/messages", (req, res) => {
  res.status(200).json({ status: "no_database_support" });
});

module.exports = app;
