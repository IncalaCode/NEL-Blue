const asyncHandler = require("express-async-handler");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const Payment = require("../Models/Payment.model");
const User = require("../Models/User.model");
const Appointment = require("../Models/Appointement.model");
const Notification = require("../Models/Notification.model");

// 1. Create Payment Intent (Client)
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  
  if (!appointmentId) {
    return res.status(400).json({ message: "Appointment ID is required" });
  }

  try {
    const appointment = await Appointment.findById(appointmentId)
      .populate("serviceId", "professionalId");
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const mechanic = await User.findById(appointment.serviceId.professionalId);
    if (!mechanic?.stripeAccountId) {
      return res.status(400).json({ 
        message: "Mechanic payment account not set up" 
      });
    }

    // Calculate amounts (10% platform fee)
    const amount = appointment.budget * 100; // in cents
    const platformFee = Math.round(amount * 0.1);
    const mechanicAmount = amount - platformFee;

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        clientId: req.user._id.toString(),
        mechanicId: mechanic._id.toString(),
        appointmentId: appointmentId.toString(),
        platformFee: platformFee.toString(),
        mechanicAmount: mechanicAmount.toString()
      },
      description: `Payment for appointment ${appointmentId}`,
      payment_method_types: ["card"],
    });

    // Create payment record
    const payment = await Payment.create({
      client: req.user._id,
      mechanic: mechanic._id,
      appointment: appointment._id,
      amount: amount / 100,
      platformFee: platformFee / 100,
      mechanicEarnings: mechanicAmount / 100,
      currency: "USD",
      paymentIntentId: paymentIntent.id,
      status: "pending_payment"
    });

    // Create notification for mechanic
    await Notification.create({
      userId: mechanic._id,
      message: `New payment initiated for appointment ${appointmentId}`,
      type: "payment_initiated",
      relatedId: payment._id
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id,
      amount: amount / 100,
      currency: "USD"
    });

  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({ 
      message: "Failed to create payment intent",
      error: error.message 
    });
  }
});

// 2. Confirm Work Completion (Client)
exports.approveWorkCompletion = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findOne({
      _id: paymentId,
      client: req.user._id
    }).populate("mechanic", "stripeAccountId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({ 
        message: "Payment must be in paid status to approve",
        currentStatus: payment.status 
      });
    }

    // Update payment status
    payment.clientApproval = true;
    await payment.save();

    // Create notification for mechanic
    await Notification.create({
      userId: payment.mechanic._id,
      message: `Client approved work completion for payment ${paymentId}`,
      type: "work_approved",
      relatedId: payment._id
    });

    res.json({ 
      message: "Work completion approved",
      paymentId: payment._id
    });

  } catch (error) {
    console.error("Work approval error:", error);
    res.status(500).json({ 
      message: "Failed to approve work completion",
      error: error.message 
    });
  }
});

// 3. Release Funds to Mechanic (System or Admin)
exports.releasePayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findById(paymentId)
      .populate("mechanic", "stripeAccountId");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({ 
        message: "Payment must be in paid status to release",
        currentStatus: payment.status 
      });
    }

    // Transfer funds to mechanic (90% of amount)
    const transferAmount = Math.round(payment.mechanicEarnings * 100);
    const transfer = await stripe.transfers.create({
      amount: transferAmount,
      currency: "usd",
      destination: payment.mechanic.stripeAccountId,
      metadata: {
        paymentId: payment._id.toString(),
        appointmentId: payment.appointment.toString()
      }
    });

    // Update payment status
    payment.status = "released";
    payment.transferId = transfer.id;
    await payment.save();

    // Update appointment status
    await Appointment.findByIdAndUpdate(
      payment.appointment,
      { status: "completed" }
    );

    // Create notifications
    await Notification.create([
      {
        userId: payment.client,
        message: `Payment released to mechanic for appointment ${payment.appointment}`,
        type: "payment_released",
        relatedId: payment._id
      },
      {
        userId: payment.mechanic,
        message: `Payment of $${payment.mechanicEarnings} received for completed work`,
        type: "payment_received",
        relatedId: payment._id
      }
    ]);

    res.json({ 
      message: "Payment released to mechanic",
      paymentId: payment._id,
      transferId: transfer.id
    });

  } catch (error) {
    console.error("Payment release error:", error);
    res.status(500).json({ 
      message: "Failed to release payment",
      error: error.message 
    });
  }
});

// 4. Create Dispute (Client or Mechanic)
exports.createDispute = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { message, images } = req.body;

  try {
    const payment = await Payment.findOne({
      _id: paymentId,
      $or: [
        { client: req.user._id },
        { mechanic: req.user._id }
      ]
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found or unauthorized" });
    }

    if (payment.status !== "paid") {
      return res.status(400).json({ 
        message: "Only paid payments can be disputed",
        currentStatus: payment.status 
      });
    }

    if (payment.dispute) {
      return res.status(400).json({ 
        message: "Dispute already exists for this payment" 
      });
    }

    // Create dispute
    payment.status = "disputed";
    payment.dispute = {
      raisedBy: req.user._id,
      message,
      images,
      status: "pending"
    };
    await payment.save();

    // Create notification for admin
    await Notification.create({
      userId: req.user._id, // Or send to admin users
      message: `New dispute raised for payment ${paymentId}`,
      type: "dispute_raised",
      relatedId: payment._id
    });

    res.json({ 
      message: "Dispute created successfully",
      disputeId: payment.dispute._id
    });

  } catch (error) {
    console.error("Dispute creation error:", error);
    res.status(500).json({ 
      message: "Failed to create dispute",
      error: error.message 
    });
  }
});

// 5. Resolve Dispute (Admin)
exports.resolveDispute = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { resolution, refundClient } = req.body;

  try {
    const payment = await Payment.findById(paymentId)
      .populate("mechanic", "stripeAccountId");

    if (!payment || payment.status !== "disputed") {
      return res.status(404).json({ 
        message: "Disputed payment not found" 
      });
    }

    if (!payment.dispute) {
      return res.status(400).json({ 
        message: "No dispute exists for this payment" 
      });
    }

    // Update dispute
    payment.dispute.status = "resolved";
    payment.dispute.resolution = resolution;
    payment.dispute.resolvedAt = new Date();

    if (refundClient) {
      // Refund the client
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        reason: "dispute"
      });

      payment.status = "refunded";
      payment.transferId = refund.id;

      // Create notifications
      await Notification.create([
        {
          userId: payment.client,
          message: `Dispute resolved: ${resolution}. You received a full refund.`,
          type: "dispute_resolved",
          relatedId: payment._id
        },
        {
          userId: payment.mechanic,
          message: `Dispute resolved: ${resolution}. Payment was refunded to client.`,
          type: "dispute_resolved",
          relatedId: payment._id
        }
      ]);
    } else {
      // Release to mechanic
      const transfer = await stripe.transfers.create({
        amount: Math.round(payment.mechanicEarnings * 100),
        currency: "usd",
        destination: payment.mechanic.stripeAccountId
      });

      payment.status = "released";
      payment.transferId = transfer.id;

      // Create notifications
      await Notification.create([
        {
          userId: payment.client,
          message: `Dispute resolved: ${resolution}. Payment was released to mechanic.`,
          type: "dispute_resolved",
          relatedId: payment._id
        },
        {
          userId: payment.mechanic,
          message: `Dispute resolved: ${resolution}. Payment was released to you.`,
          type: "dispute_resolved",
          relatedId: payment._id
        }
      ]);
    }

    await payment.save();

    res.json({ 
      message: "Dispute resolved successfully",
      paymentId: payment._id,
      resolution
    });

  } catch (error) {
    console.error("Dispute resolution error:", error);
    res.status(500).json({ 
      message: "Failed to resolve dispute",
      error: error.message 
    });
  }
});

// 6. Webhook Handler for Stripe Events
exports.handleWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        await Payment.findOneAndUpdate(
          { paymentIntentId: paymentIntent.id },
          { 
            status: "paid",
            paymentMethod: paymentIntent.payment_method_types[0],
            transactionId: paymentIntent.id
          }
        );
        break;

      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;
        await Payment.findOneAndUpdate(
          { paymentIntentId: failedIntent.id },
          { 
            status: "failed",
            transactionId: failedIntent.id
          }
        );
        break;

      case "account.updated":
        const account = event.data.object;
        await User.findOneAndUpdate(
          { stripeAccountId: account.id },
          { 
            payoutStatus: account.charges_enabled ? "Enabled" : "Pending",
            identityVerified: account.requirements?.disabled_reason === null
          }
        );
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

// 7. Get Payment Details
exports.getPaymentDetails = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  try {
    const payment = await Payment.findById(paymentId)
      .populate("client", "firstName lastName email")
      .populate("mechanic", "firstName lastName email")
      .populate("appointment");

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Verify requester is either client or mechanic
    if (!req.user._id.equals(payment.client._id) && 
        !req.user._id.equals(payment.mechanic._id) &&
        req.user.role !== "Admin") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(payment);
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({ 
      message: "Failed to get payment details",
      error: error.message 
    });
  }
});