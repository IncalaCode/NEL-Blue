const express = require("express");
const router = express.Router();
const { protectRoute } = require("../Middleware/Protect.route");
const { getFeedback,addFeedback } = require("../Controller/Feedback.controller");
/**
 * @swagger
 * tags:
 *   name: Feedback
 *   description: Manage user feedback for handyman
 */

/**
 * @swagger
 * /feedback/getfeedback:
 *   get:
 *     summary: Get feedback provided by the current user
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved feedback
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userId:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       email:
 *                         type: string
 *                       profileImage:
 *                         type: string
 *                   mechanicId:
 *                     type: string
 *                   rating:
 *                     type: number
 *                   feedback:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Something went wrong
 */

router.get("/getfeedback",protectRoute,getFeedback);
/**
 * @swagger
 * /feedback/addFeedback/{id}:
 *   put:
 *     summary: Add feedback for a handyman
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: handyman ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - handymanId
 *               - rating
 *               - feedback
 *             properties:
 *               handymanId:
 *                 type: string
 *               rating:
 *                 type: number
 *               feedback:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 populatedFeedback:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: object
 *                       properties:
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         email:
 *                           type: string
 *                     handymanId:
 *                       type: string
 *                     rating:
 *                       type: number
 *                     feedback:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       403:
 *         description: Not allowed to provide feedback
 *       500:
 *         description: Something went wrong
 */


router.put("/addFeedback/:id",protectRoute,addFeedback);
module.exports = router;