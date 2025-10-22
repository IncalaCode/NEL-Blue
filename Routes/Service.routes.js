const {getAllServices}=require("../Controller/service.controller")
const asyncHandler = require("express-async-handler");
const express = require("express");
const router = express.Router();
/**
 * @swagger
 * /service/getAllServices:
 *   get:
 *     summary: Get all available services
 *     tags: [Service]
 *     responses:
 *       200:
 *         description: A list of all services
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1b0f9a93b2e7c12345678"
 *                       serviceName:
 *                         type: string
 *                         example: "Oil Change"
 *                       category:
 *                         type: string
 *                         example: "Maintenance"
 *                       price:
 *                         type: object
 *                         properties:
 *                           min:
 *                             type: number
 *                             example: 50
 *                           max:
 *                             type: number
 *                             example: 100
 *       500:
 *         description: Internal server error
 */
router.get("/getAllServices",getAllServices)
module.exports = router;