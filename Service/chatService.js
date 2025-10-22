const socketio = require("socket.io");
const { Chat, Message } = require("../Models/Chat.model");

let io;

exports.init = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("New client connected");

    // Join chat room
    socket.on("join_chat", (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat ${chatId}`);
    });

    // Leave chat room
    socket.on("leave_chat", (chatId) => {
      socket.leave(chatId);
      console.log(`User left chat ${chatId}`);
    });

    // Listen for new messages
    socket.on("send_message", async (data) => {
      try {
        const { chatId, content, senderId } = data;
        
        // Save message to database
        const message = new Message({
          sender: senderId,
          content,
          messageType: "text"
        });

        const chat = await Chat.findById(chatId);
        chat.messages.push(message);
        chat.lastMessage = message._id;
        await chat.save();

        // Broadcast to other users in the chat
        socket.to(chatId).emit("receive_message", message);
      } catch (error) {
        console.error("Error sending message:", error);
      }
    });

    // Call signaling
    socket.on("call_signal", (data) => {
      const { chatId, signal, callerId } = data;
      socket.to(chatId).emit("call_signal", { signal, callerId });
    });

    // Call acceptance
    socket.on("accept_call", (data) => {
      const { chatId, callerId } = data;
      socket.to(chatId).emit("call_accepted", { callerId });
    });

    // End call
    socket.on("end_call", (data) => {
      const { chatId, callDuration } = data;
      socket.to(chatId).emit("call_ended", { callDuration });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
};

exports.getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};