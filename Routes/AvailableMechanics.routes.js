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
 *     summary: Search professionals by name, service, badge, location, or price range
 *     tags: [AvailableProfessional]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search keyword for professional's firstName or lastName
 *       - in: query
 *         name: serviceName
 *         schema:
 *           type: string
 *         description: Filter by service name
 *       - in: query
 *         name: isVerified
 *         schema:
 *           type: boolean
 *         description: Filter by KYC verified professionals
 *       - in: query
 *         name: badge
 *         schema:
 *           type: string
 *           enum: [verified, kyc, identity, payout]
 *         description: Filter by badge type (verified/kyc, identity, payout)
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Search in city, state, country, or address
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by specific city
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by specific state
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by specific country
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
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
router.get("/getProfessionalSearch", searchProfessionals);

module.exports = router;