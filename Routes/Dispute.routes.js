const express=require("express");
const router=express.Router();
const {protectRoute}=require("../Middleware/Protect.route");
const { 
  upload, 
  uploadImages, 
  uploadPDFs,
  handleFileUploadErrors 
}=require("../config/MulterConfig")
const {getDispute,addDispute}=require("../Controller/Dispute.controller");
/**
 * @swagger
 * tags:
 *   name: Disputes
 *   description: Dispute management
 */

/**
 * @swagger
 * /dispute/getDispute:
 *   get:
 *     summary: Get all disputes
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all disputes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   message:
 *                     type: string
 *                   image:
 *                     type: array
 *                     items:
 *                       type: string
 *       500:
 *         description: Something went wrong
 */

router.get("/getDispute",protectRoute,getDispute);
/**
 * @swagger
 * /dispute/addDispute:
 *   post:
 *     summary: Add a new dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               message:
 *                 type: string
 *               image:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Dispute created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 message:
 *                   type: string
 *                 image:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Something went wrong
 */
router.post("/addDispute",uploadImages.array("image",10),

protectRoute,addDispute);
module.exports=router;