const express = require("express");
const router = express.Router();
const { protectRoute } = require("../Middleware/Protect.route");
const { getProfile,updatePassword,addService,editService,addSpecialization } = require("../Controller/Mechanic.User.controller");
/**
 * @swagger
 * /handyman/getProfile:
 *   get:
 *     summary: Get handyman user profile with services
 *     tags: [Handyman]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */

router.get("/getProfile",protectRoute,getProfile);
/**
 * @swagger
 * /handyman/updatePassword:
 *   put:
 *     summary: Update Handyman user password
 *     tags: [Handyman]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid old password
 *       401:
 *         description: Unauthorized
 */
router.put("/updatePassword",protectRoute,updatePassword);
/**
 * @swagger
 * /handyman/addService:
 *   post:
 *     summary: Add a new service for the handyman
 *     tags: [Handyman]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceName
 *               - price
 *             properties:
 *               serviceName:
 *                 type: string
 *               price:
 *                 type: number
 *               availability:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                     startTime:
 *                       type: string
 *                       example: "09:00"
 *                     endTime:
 *                       type: string
 *                       example: "17:00"
 *                     status:
 *                       type: string
 *                       enum: [Available, Unavailable]
 *     responses:
 *       201:
 *         description: Service added successfully
 *       401:
 *         description: Unauthorized
 */

router.post("/addService",protectRoute,addService);
/**
 * @swagger
 * /handyman/editService:
 *   put:
 *     summary: Edit existing service and availability
 *     tags: [Handyman]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               serviceName:
 *                 type: string
 *               price:
 *                 type: number
 *               availability:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday]
 *                     startTime:
 *                       type: string
 *                       example: "09:00"
 *                     endTime:
 *                       type: string
 *                       example: "17:00"
 *                     status:
 *                       type: string
 *                       enum: [Available, Unavailable]
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Unauthorized to edit this service
 *       404:
 *         description: Service not found
 */

router.put("/editService",protectRoute,editService);
/**
 * @swagger
 * /handyman/addSpecialization:
 *   post:
 *     summary: Add specialization(s) for handyman
 *     tags: [Handyman]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialization
 *             properties:
 *               specialization:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Specialization(s) added successfully
 *       400:
 *         description: Specialization must be an array
 *       403:
 *         description: Only handymans can add specializations
 *       404:
 *         description: User not found
 */

router.post("/addSpecialization",protectRoute,addSpecialization);
module.exports = router;