//get all mechanics available for appointments
const express = require("express");
const router = express.Router();
const { getAvailableMechanics, getProfessionalsByCategory } = require("../Controller/AvailableMechanics.controller");
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

/**
 * @swagger
 * /availableProfessional/getProfessionaWithCatagories:
 *   get:
 *     summary: Get professionals by service category with pagination
 *     tags: [Handyman]
 *     parameters:
 *       - in: query
 *         name: serviceName
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the service category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Successfully retrieved professionals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 locationUsed:
 *                   type: object
 *                   properties:
 *                     lat:
 *                       type: number
 *                       nullable: true
 *                     long:
 *                       type: number
 *                       nullable: true
 *                     country:
 *                       type: string
 *                       nullable: true
 *                     region:
 *                       type: string
 *                       nullable: true
 *                     city:
 *                       type: string
 *                       nullable: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Service not found
 *       500:
 *         description: Server error
 */
router.get("/getProfessionaWithCatagories", getProfessionalsByCategory);

module.exports = router;