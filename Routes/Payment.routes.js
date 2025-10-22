const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  approveWorkCompletion,
  releasePayment,
  createDispute,
  resolveDispute,
  handleWebhook,
  getPaymentDetails
} = require("../Controller/Payment.controller");
const {protectRoute,adminRoute}=require("../Middleware/Protect.route")
// Client routes

/**
 * @swagger
 * /api/payment/intent:
 *   post:
 *     summary: Create payment intent (Client)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentIntentRequest'
 *     responses:
 *       200:
 *         description: Payment intent created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *                   description: Stripe client secret for payment confirmation
 *                 paymentId:
 *                   type: string
 *                   description: ID of the created payment record
 *                 amount:
 *                   type: number
 *                   description: Payment amount in USD
 *                 currency:
 *                   type: string
 *                   description: Payment currency
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Appointment not found or mechanic not set up
 *       500:
 *         description: Server error
 */

router.post("/intent", protectRoute, createPaymentIntent);
/**
 * @swagger
 * /api/payment/{paymentId}/approve:
 *   post:
 *     summary: Approve work completion (Client)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WorkApprovalRequest'
 *     responses:
 *       200:
 *         description: Work approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *       400:
 *         description: Invalid payment status
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */

router.post("/:paymentId/approve", protectRoute, approveWorkCompletion);
/**
 * @swagger
 * /api/payment/{paymentId}/dispute:
 *   post:
 *     summary: Create dispute (Client or Mechanic)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisputeRequest'
 *     responses:
 *       200:
 *         description: Dispute created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 disputeId:
 *                   type: string
 *       400:
 *         description: Invalid payment status or dispute already exists
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.post("/:paymentId/dispute", protectRoute, createDispute);
/**
 * @swagger
 * /api/payment/{paymentId}/release:
 *   post:
 *     summary: Release payment to mechanic (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the payment
 *     responses:
 *       200:
 *         description: Payment released successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *                 transferId:
 *                   type: string
 *       400:
 *         description: Invalid payment status
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */

// Admin routes
router.post("/:paymentId/release", protectRoute, adminRoute, releasePayment);
/**
 * @swagger
 * /api/payment/{paymentId}/resolve:
 *   post:
 *     summary: Resolve dispute (Admin)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the payment
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DisputeResolution'
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 paymentId:
 *                   type: string
 *                 resolution:
 *                   type: string
 *       400:
 *         description: No dispute exists
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */

router.post("/:paymentId/resolve", protectRoute, adminRoute, resolveDispute);

/**
 * @swagger
 * /api/payment/webhook:
 *   post:
 *     summary: Stripe webhook handler (System)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         description: Webhook error
 *       500:
 *         description: Webhook processing failed
 */

// System/webhook route
router.post("/webhook", handleWebhook);
/**
 * @swagger
 * /api/payment/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the payment
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       403:
 *         description: Unauthorized access
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
// General access
router.get("/:paymentId", protectRoute, getPaymentDetails);

module.exports = router;