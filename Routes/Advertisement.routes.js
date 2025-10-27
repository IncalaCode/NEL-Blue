const express = require("express");
const router = express.Router();
const { protectRoute } = require("../Middleware/Protect.route");
const {
  createAdvertisement,
  updateAdvertisement,
  getAdvertisementById,
  deleteAdvertisement,
  getAdvertisements,
  getMyAdvertisements
} = require("../Controller/Advertisement.controller");

/**
 * @swagger
 * tags:
 *   name: Advertisement
 *   description: Advertisement management endpoints
 */

/**
 * @swagger
 * /advertisement:
 *   post:
 *     summary: Create a new advertisement
 *     tags: [Advertisement]
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
 *               - price
 *               - location
 *               - description
 *             properties:
 *               serviceId:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               available:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Advertisement created successfully
 */
router.post("/", protectRoute, createAdvertisement);

/**
 * @swagger
 * /advertisement:
 *   get:
 *     summary: Get all advertisements (feed)
 *     tags: [Advertisement]
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
 *         description: List of advertisements
 */
router.get("/", getAdvertisements);

/**
 * @swagger
 * /advertisement/my-own:
 *   get:
 *     summary: Get my own advertisements (latest first)
 *     tags: [Advertisement]
 *     security:
 *       - bearerAuth: []
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
 *         description: List of my advertisements
 */
router.get("/my-own", protectRoute, getMyAdvertisements);

/**
 * @swagger
 * /advertisement/{id}:
 *   get:
 *     summary: Get an advertisement by ID
 *     tags: [Advertisement]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advertisement details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 advertisement:
 *                   type: object
 *       404:
 *         description: Advertisement not found
 */
router.get("/:id", getAdvertisementById);

/**
 * @swagger
 * /advertisement/{id}:
 *   put:
 *     summary: Update an advertisement
 *     tags: [Advertisement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceId:
 *                 type: string
 *               price:
 *                 type: number
 *               location:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               available:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Advertisement updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 advertisement:
 *                   type: object
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Advertisement not found
 */
router.put("/:id", protectRoute, updateAdvertisement);

/**
 * @swagger
 * /advertisement/{id}:
 *   delete:
 *     summary: Delete an advertisement
 *     tags: [Advertisement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Advertisement deleted successfully
 *       404:
 *         description: Advertisement not found
 */
router.delete("/:id", protectRoute, deleteAdvertisement);

module.exports = router;