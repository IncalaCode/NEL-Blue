//get all mechanics available for appointments
const express = require("express");
const router = express.Router();
const { getAvailableMechanics, getProfessionalsByCategory, searchProfessionals } = require("../Controller/AvailableMechanics.controller");
/**
 * @swagger
 * tags:
 *   name: AvailableProfessional
 *   description: Available professional management
 */

/**
 * @swagger
 * /availableProfessional/getAvailableProfessionals:
 *   get:
 *     summary: Get all available professionals for appointments (paginated)
 *     tags: [AvailableProfessional]
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

router.get("/getAvailableProfessionals", getAvailableMechanics);

/**
 * @swagger
 * /availableProfessional/getProfessionaWithCatagories:
 *   get:
 *     summary: Get professionals filtered by serviceName with pagination
 *     tags: [AvailableProfessional]
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

/**
 * @swagger
 * /availableProfessional/getProfessionalSearch:
 *   get:
 *     summary: Search professionals by name, service, price range, or location
 *     tags: [AvailableProfessional]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search keyword for professional's firstName, lastName, or services
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *         description: Filter by service name
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by verified professionals
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price of service
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price of service
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Latitude for location-based search (optional)
 *       - in: query
 *         name: long
 *         schema:
 *           type: number
 *         description: Longitude for location-based search (optional)
 *     responses:
 *       200:
 *         description: Successfully retrieved professionals matching the search
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
 *                     long:
 *                       type: number
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
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/getProfessionalSearch", searchProfessionals);

module.exports = router;