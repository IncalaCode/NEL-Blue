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
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   serviceName:
 *                     type: string
 *                   price:
 *                     type: number
 *                   category:
 *                     type: string
 *                   serviceCode:
 *                     type: number
 *                   professionalId:
 *                     type: string
 *                   availability:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         day:
 *                           type: string
 *                         startTime:
 *                           type: string
 *                         endTime:
 *                           type: string
 *                         status:
 *                           type: string
 *       500:
 *         description: Internal server error
 */
router.get("/getAllServices",getAllServices)
module.exports = router;