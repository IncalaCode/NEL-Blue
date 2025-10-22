const express = require("express");
const router = express.Router();
const {
  startChat,
  sendMessage,
  initiateCall,
  getChatHistory,
  getUserChats
} = require("../Controller/Chat.controller");
const {protectRoute}=require("../Middleware/Protect.route")
// Start a new chat (requires existing appointment)
/**
 * @swagger
 * /api/chat/start/{appointmentId}:
 *   post:
 *     summary: Start a new chat for an appointment
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: appointmentId
 *         schema:
 *           type: string
 *         required: true
 *         description: The appointment ID
 *     responses:
 *       200:
 *         description: Chat created or retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       403:
 *         description: Not authorized to start this chat
 *       404:
 *         description: Appointment not found
 */
router.post("/start/:appointmentId", protectRoute, startChat);
/**
 * @swagger
 * /api/chat/{chatId}/message:
 *   post:
 *     summary: Send a message in a chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: The chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/NewMessage'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       403:
 *         description: Not authorized to send messages in this chat
 *       404:
 *         description: Chat not found
 */
// Send a message
router.post("/:chatId/message",protectRoute, sendMessage);
/**
 * @swagger
 * /api/chat/{chatId}/call:
 *   post:
 *     summary: Initiate a voice or video call
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: The chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CallInitiation'
 *     responses:
 *       201:
 *         description: Call initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 callId:
 *                   type: string
 *                   description: Unique call ID
 *                 chatId:
 *                   type: string
 *                 caller:
 *                   type: string
 *                   description: ID of the caller
 *                 callType:
 *                   type: string
 *                   enum: [voice, video]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       403:
 *         description: Not authorized to initiate calls in this chat
 *       404:
 *         description: Chat not found
 */
// Initiate a call
router.post("/:chatId/call",protectRoute, initiateCall);
/**
 * @swagger
 * /api/chat/{chatId}:
 *   get:
 *     summary: Get chat history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         schema:
 *           type: string
 *         required: true
 *         description: The chat ID
 *     responses:
 *       200:
 *         description: Chat history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       403:
 *         description: Not authorized to view this chat
 *       404:
 *         description: Chat not found
 */
// Get chat history
router.get("/:chatId",protectRoute, getChatHistory);
/**
 * @swagger
 * /api/chat:
 *   get:
 *     summary: Get all chats for current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's chats
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 */
// Get all chats for current user
router.get("/", protectRoute, getUserChats);

module.exports = router;