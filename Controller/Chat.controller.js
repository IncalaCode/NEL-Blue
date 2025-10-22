const { Chat, Message } = require("../Models/Chat.model");
const Appointement = require("../Models/Appointement.model");
const User = require("../Models/User.model");
const { getIo } = require("../socket");

// Start a new chat (only if appointment exists)
exports.startChat = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user._id;

    // Check if appointment exists and user is part of it
    const appointment = await Appointement.findById(appointmentId)
      .populate("userId")
      .populate("serviceId");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Verify user is either client or assigned mechanic
    if (
      !userId.equals(appointment.userId._id) &&
      !(req.user.role === "Mechanic" && userId.equals(appointment.serviceId.mechanic))
    ) {
      return res.status(403).json({ message: "Not authorized to start this chat" });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({ appointment: appointmentId })
      .populate("client mechanic");

    if (!chat) {
      chat = new Chat({
        appointment: appointmentId,
        client: appointment.userId._id,
        mechanic: appointment.serviceId.mechanic,
        messages: []
      });
      await chat.save();
      await chat.populate("client mechanic");
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, messageType = "text", attachment } = req.body;
    const senderId = req.user._id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify user is part of the chat
    if (!senderId.equals(chat.client) && !senderId.equals(chat.mechanic)) {
      return res.status(403).json({ message: "Not authorized to send messages in this chat" });
    }

    const message = new Message({
      sender: senderId,
      content,
      messageType,
      attachment
    });

    chat.messages.push(message);
    chat.lastMessage = message._id;
    await chat.save();

    // Emit the message via Socket.io
    const io = getIo();
    const recipientId = senderId.equals(chat.client) ? chat.mechanic : chat.client;
    
    io.to(`chat_${chatId}`).emit("receive_message", {
      ...message.toObject(),
      chatId
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Initiate a call
exports.initiateCall = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { callType } = req.body; // 'voice' or 'video'
    const callerId = req.user._id;

    const chat = await Chat.findById(chatId);

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify user is part of the chat
    if (!callerId.equals(chat.client) && !callerId.equals(chat.mechanic)) {
      return res.status(403).json({ message: "Not authorized to initiate calls in this chat" });
    }

    const message = new Message({
      sender: callerId,
      messageType: "system",
      callDetails: {
        callType,
        status: "initiated",
        timestamp: new Date()
      }
    });

    chat.messages.push(message);
    chat.lastMessage = message._id;
    await chat.save();

    // Generate a simple call ID (in production, use a proper service)
    const callId = `${chatId}_${Date.now()}`;

    res.status(201).json({
      callId,
      chatId,
      caller: callerId,
      callType,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get chat history
exports.getChatHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId)
      .populate("client mechanic messages.sender");

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Verify user is part of the chat
    if (!userId.equals(chat.client) && !userId.equals(chat.mechanic)) {
      return res.status(403).json({ message: "Not authorized to view this chat" });
    }

    res.status(200).json(chat);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all chats for a user
exports.getUserChats = async (req, res) => {
  try {
    const userId = req.user._id;

    const chats = await Chat.find({
      $or: [{ client: userId }, { mechanic: userId }]
    })
      .populate("client mechanic lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};