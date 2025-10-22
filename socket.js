const socketio = require("socket.io");
const { Chat, Message } = require("./Models/Chat.model");
const User = require("./Models/User.model");

let io;

exports.init = (server) => {
  io = socketio(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5000",
      methods: ["GET", "POST"]
    }
  });

  // Socket.io authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error("Authentication error"));
      }

      // Verify token (using your existing auth logic)
      const user = await User.findById(token);
      if (!user) {
        return next(new Error("Authentication error"));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`New client connected: ${socket.user._id}`);

    // Store user's socket ID for reference
    socket.join(`user_${socket.user._id}`);

    // Join chat room
    socket.on("join_chat", (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`User ${socket.user._id} joined chat ${chatId}`);
    });

    // Leave chat room
    socket.on("leave_chat", (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`User ${socket.user._id} left chat ${chatId}`);
    });

    // Listen for new messages
    socket.on("send_message", async (data) => {
      try {
        const { chatId, content, messageType = "text", attachment } = data;
        
        // Save message to database
        const message = new Message({
          sender: socket.user._id,
          content,
          messageType,
          attachment
        });

        const chat = await Chat.findByIdAndUpdate(
          chatId,
          {
            $push: { messages: message },
            $set: { lastMessage: message._id }
          },
          { new: true }
        ).populate("client mechanic");

        if (!chat) {
          throw new Error("Chat not found");
        }

        // Broadcast to other users in the chat
        const recipientId = socket.user._id.equals(chat.client._id) 
          ? chat.mechanic._id 
          : chat.client._id;

        io.to(`chat_${chatId}`).emit("receive_message", {
          ...message.toObject(),
          chatId
        });

        // Notify recipient if they're not in the chat
        io.to(`user_${recipientId}`).emit("new_message_notification", {
          chatId,
          message: message.content,
          sender: socket.user._id
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message_error", { error: error.message });
      }
    });

    // Call signaling
    socket.on("call_signal", async (data) => {
      try {
        const { chatId, signal, callType } = data;
        
        // Verify user is part of the chat
        const chat = await Chat.findById(chatId);
        if (!chat || 
            (!socket.user._id.equals(chat.client) && !socket.user._id.equals(chat.mechanic))) {
          throw new Error("Not authorized for this chat");
        }

        const recipientId = socket.user._id.equals(chat.client) 
          ? chat.mechanic 
          : chat.client;

        // Notify recipient of incoming call
        io.to(`user_${recipientId}`).emit("incoming_call", {
          chatId,
          callerId: socket.user._id,
          signal,
          callType
        });
      } catch (error) {
        console.error("Call signaling error:", error);
        socket.emit("call_error", { error: error.message });
      }
    });

    // Call acceptance
    socket.on("accept_call", (data) => {
      const { chatId, callerId, signal } = data;
      io.to(`user_${callerId}`).emit("call_accepted", { 
        chatId,
        signal 
      });
    });

    // End call
    socket.on("end_call", async (data) => {
      try {
        const { chatId, callDuration } = data;
        
        // Save call details to chat history
        const message = new Message({
          sender: socket.user._id,
          messageType: "system",
          callDetails: {
            callType: data.callType || "voice",
            duration: callDuration,
            status: "completed",
            timestamp: new Date()
          }
        });

        await Chat.findByIdAndUpdate(chatId, {
          $push: { messages: message },
          $set: { lastMessage: message._id }
        });

        // Notify other participant
        io.to(`chat_${chatId}`).emit("call_ended", { callDuration });
      } catch (error) {
        console.error("Error ending call:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.user._id}`);
    });
  });
};

exports.getIo = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};