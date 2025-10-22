const express = require("express");
const router = express.Router();
const { protectRoute } = require("../Middleware/Protect.route");
const { getAppointment,updateProjectStatus, deleteAppointement ,addAppointment,getHistory } = require("../Controller/Appointement.controller");
/**
 * @swagger
 * tags:
 *   name: Appointment
 *   description: Appointment management
 */

/**
 * @swagger
 * /appointement/getappointement:
 *   get:
 *     summary: Get all appointments for the logged-in user
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of appointments with service details and availability
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   serviceId:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       serviceName:
 *                         type: string
 *                       availability:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             day:
 *                               type: string
 *                             startTime:
 *                               type: string
 *                             endTime:
 *                               type: string
 *                   appointmentDate:
 *                     type: string
 *                     format: date
 *                   appointmentTime:
 *                     type: string
 *                   status:
 *                     type: string
 *       500:
 *         description: Something went wrong
 */

router.get("/getappointement",protectRoute,getAppointment);
/**
 * @swagger
 * /appointement/deleteappointement/{id}:
 *   put:
 *     summary: Delete an appointment by ID
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Appointment ID
 *     responses:
 *       200:
 *         description: Appointment deleted successfully
 *       404:
 *         description: Appointment not found or not owned by user
 *       500:
 *         description: Something went wrong
 */

router.put("/deleteappointement/:id",protectRoute,deleteAppointement);
/**
 * @swagger
 * /appointement/history:
 *   get:
 *     summary: Get appointment history (Confirmed or Cancelled)
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of historical appointments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   status:
 *                     type: string
 *                   appointmentDate:
 *                     type: string
 *                     format: date
 *                   appointmentTime:
 *                     type: string
 *                   serviceId:
 *                     type: object
 *                     properties:
 *                       serviceName:
 *                         type: string
 *       500:
 *         description: Something went wrong
 */
router.get("/history",protectRoute,getHistory);
/**
 * @swagger
 * /appointement/addappointement:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - catagories
 *               - vehicleType
 *               - appointmentDate
 *               - appointmentTime
 *               - issue
 *               - budget
 *             properties:
 *               serviceId:
 *                 type: string
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
 *               otherIssue:
 *                 type: string
 *               budget:
 *                 type: number
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Missing fields or invalid time
 *       404:
 *         description: Service not found
 *       500:
 *         description: Something went wrong
 */

router.post("/addappointement",protectRoute,addAppointment);
/**
 * @swagger
 * /appointement/projectstatus/{id}:
 *   put:
 *     summary: Update the status of a project
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the project to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, Progress, OnHold, Cancelled]
 *                 example: Completed
 *     responses:
 *       200:
 *         description: Project status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Project status updated successfully
 *                 updatedProject:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "64fc52a5c3f9a2b00123abcd"
 *                     status:
 *                       type: string
 *                       example: Completed
 *                     amount:
 *                       type: number
 *                       example: 500
 *                     projectDate:
 *                       type: string
 *                       format: date
 *                       example: "2025-08-02"
 *                     ProjectTime:
 *                       type: string
 *                       example: "10:00 AM"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-01T12:00:00Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-08-02T15:00:00Z"
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */

router.put("/projectstatus/:id",protectRoute,updateProjectStatus);
module.exports = router;