const express = require("express");
const { Pool } = require("pg");
const app = express();

app.use(express.json());

const pool = new Pool({
  connectionString:
    "postgres://neondb_owner:npg_WtV6Y5yvSpkm@ep-shiny-mode-a4hujpv3-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require",
});

// Tạo bảng nếu chưa tồn tại (bao gồm cả sender_id và recipient_id để tương thích với payload Zalo)
pool.query(`
  CREATE TABLE IF NOT EXISTS zalo_messages (
    id SERIAL PRIMARY KEY,
    app_id TEXT,
    sender_id TEXT,
    user_id TEXT,
    recipient_id TEXT,
    event_name TEXT,
    message_id TEXT,
    text TEXT,
    timestamp BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

app.post("/api/webhook", async (req, res) => {
  const payload = req.body;
  console.log("Received Zalo webhook:", JSON.stringify(payload, null, 2));

  if (!payload) {
    return res
      .status(400)
      .json({ status: "error", message: "No payload provided" });
  }

  try {
    const eventName = payload["event_name"];
    if (!eventName || eventName !== "user_send_text") {
      console.log(`Ignoring event: ${eventName || "undefined"}`);
      return res.status(200).json({ status: "ignored" });
    }

    // Xử lý payload linh hoạt
    let senderId = payload.sender?.id || payload.user_id || null;
    let recipientId = payload.recipient?.id || null;
    const userId = payload.user_id || payload.user_id_by_app || null;
    const { msg_id: messageId, text, timestamp } = payload.message || {};

    if (!messageId || !text || !timestamp) {
      return res
        .status(400)
        .json({ status: "error", message: "Missing required message fields" });
    }

    await pool.query(
      "INSERT INTO zalo_messages (app_id, sender_id, user_id, recipient_id, event_name, message_id, text, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
      [
        payload.app_id,
        senderId,
        userId,
        recipientId,
        eventName,
        messageId,
        text,
        parseInt(timestamp),
      ]
    );

    console.log(
      `Processed message - App ID: ${payload.app_id}, Sender ID: ${senderId}, User ID: ${userId}, Recipient ID: ${recipientId}, Message ID: ${messageId}, Text: ${text}, Timestamp: ${timestamp}`
    );
    res
      .status(200)
      .json({ status: "received", message_id: messageId, user_id: userId });
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

app.get("/api/webhook/messages", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM zalo_messages ORDER BY created_at DESC LIMIT 1"
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(200).json({ status: "no_messages" });
    }
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = app;
