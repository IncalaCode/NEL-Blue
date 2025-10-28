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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
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
 *     summary: Search professionals with geospatial and filter support
 *     tags: [AvailableProfessional]
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: Search by name
 *       - name: serviceName
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by service
 *       - name: badge
 *         in: query
 *         schema:
 *           type: string
 *           enum: [verified, kyc, identity, payout]
 *         description: Filter by badge
 *       - name: latitude
 *         in: query
 *         schema:
 *           type: number
 *         description: Latitude for location search
 *       - name: longitude
 *         in: query
 *         schema:
 *           type: number
 *         description: Longitude for location search
 *       - name: radius
 *         in: query
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in km
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get("/getProfessionalSearch", searchProfessionals);

module.exports = router;