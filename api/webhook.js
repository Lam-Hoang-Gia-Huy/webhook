const express = require("express");
const app = express();
const fs = require("fs"); // Giữ nguyên để tránh lỗi nếu không xóa hoàn toàn

app.use(express.json());

// Lưu tin nhắn mới vào bộ nhớ tạm (mảng)
let latestMessage = null;

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

    // Thử ghi file (sẽ lỗi trên Vercel, nhưng giữ để tương thích)
    try {
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
    } catch (fileError) {
      console.error("File write failed (EROFS):", fileError);
      // Nếu ghi file thất bại, lưu vào bộ nhớ tạm
      latestMessage = {
        senderId,
        userId,
        messageId,
        text,
        timestamp,
      };
      console.log("Saved new message to memory as fallback");
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
  }
});

// Endpoint để Java truy vấn tin nhắn mới
app.get("/api/webhook/latest", (req, res) => {
  if (latestMessage) {
    res.status(200).json(latestMessage);
    latestMessage = null; // Xóa sau khi gửi để tránh lặp
  } else {
    res.status(200).json({ status: "no_new_message" });
  }
});

app.get("/api/webhook/messages", (req, res) => {
  res.status(200).json({ status: "no_database_support" });
});

module.exports = app;
