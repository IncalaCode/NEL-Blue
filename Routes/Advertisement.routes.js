const express = require("express");
const router = express.Router();
const { protectRoute } = require("../Middleware/Protect.route");
const {
  createAdvertisement,
  deleteAdvertisement
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