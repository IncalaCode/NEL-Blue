const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  attachment: {
    type: [String] // URL to file (image, document, etc.)
  },
  messageType: {
    type: String,
    enum: ["text", "image", "document", "voice", "system"],
    default: "text"
  },
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  callDetails: {
    callType: {
      type: String,
      enum: ["voice", "video"]
    },
    duration: Number, // in seconds
    status: {
      type: String,
      enum: ["initiated", "answered", "missed", "completed"]
    },
    timestamp: Date
  }
}, { timestamps: true });

const chatSchema = new mongoose.Schema({
  appointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appointement",
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  mechanic: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  messages: [messageSchema],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  },
  active: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Indexes for faster querying
chatSchema.index({ client: 1, mechanic: 1 });
chatSchema.index({ appointment: 1 });
chatSchema.index({ "messages.sender": 1 });
chatSchema.index({ lastMessage: 1 });

const Chat = mongoose.model("Chat", chatSchema);
const Message = mongoose.model("Message", messageSchema);

module.exports = { Chat, Message };