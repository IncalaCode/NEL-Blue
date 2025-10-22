//get notification,accept notification and reject

const express = require("express");
const router = express.Router();
const { protectRoute } = require("../Middleware/Protect.route");
const {
    getNotification,
    acceptNotification,
    rejectNotification,
} = require("../Controller/Notification.controller");
/**
 * @swagger
 * tags:
 *   name: Notification
 *   description: Notification management
 */

/**
 * @swagger
 * /notification/getNotification:
 *   get:
 *     summary: Get notifications for a user
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to fetch notifications for
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Missing or invalid userId
 *       404:
 *         description: No notifications found
 *       401:
 *         description: Unauthorized
 */

router.get("/getNotification", protectRoute, getNotification);
/**
 * @swagger
 * /notification/acceptNotification:
 *   put:
 *     summary: Accept (create) a notification
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - catagories
 *               - vehicleType
 *               - appointmentDate
 *               - appointmentTime
 *               - issue
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID
 *               catagories:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *               appointmentTime:
 *                 type: string
 *               issue:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Missing required fields or invalid userId format
 *       401:
 *         description: Unauthorized
 */

router.put("/acceptNotification", protectRoute, acceptNotification);
/**
 * @swagger
 * /notification/rejectNotification:
 *   put:
 *     summary: Reject (cancel) a notification
 *     tags: [Notification]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 description: Notification ID to cancel
 *     responses:
 *       200:
 *         description: Notification cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Missing or invalid notification id
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */

router.put("/rejectNotification", protectRoute, rejectNotification);
module.exports = router;