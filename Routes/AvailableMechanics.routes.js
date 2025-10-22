//get all mechanics available for appointments
const express = require("express");
const router = express.Router();
const { getAvailableMechanics } = require("../Controller/AvailableMechanics.controller");
/**
 * @swagger
 * tags:
 *   name: Handyman
 *   description: Handyman availability management
 */

/**
 * @swagger
 * /availablehandyman/getAvailablehandyman:
 *   get:
 *     summary: Get all Handyman available for appointments
 *     tags: [Handyman]
 *     responses:
 *       200:
 *         description: Successfully retrieved all Handyman with their services, availability, and feedback rating
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *                   specialization:
 *                     type: array
 *                     items:
 *                       type: string
 *                   services:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         serviceName:
 *                           type: string
 *                         price:
 *                           type: number
 *                         availability:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               day:
 *                                 type: string
 *                               startTime:
 *                                 type: string
 *                               endTime:
 *                                 type: string
 *                               status:
 *                                 type: string
 *                   averageRating:
 *                     type: string
 *                   totalFeedbacks:
 *                     type: number
 *       500:
 *         description: Something went wrong
 */

router.get("/getAvailablehandyman", getAvailableMechanics);
module.exports = router;