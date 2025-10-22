const mongoose = require("mongoose");
const paymentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mechanic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    professional: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    platformFee: {
      type: Number,
      required: true,
    },
    mechanicEarnings: {
      type: Number
    },
    professionalEarnings: {
      type: Number
    },
    currency: {
      type: String,
      default: "USD",
    },
    paymentIntentId: {
      type: String,
      required: true,
    },
    transferId: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "pending_payment", // Client needs to pay
        "paid", // Client paid, funds in escrow
        "released", // Funds released to mechanic
        "refunded", // Funds refunded to client
        "disputed", // Payment in dispute
        "cancelled", // Payment cancelled
      ],
      default: "pending_payment",
    },
    paymentMethod: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    dispute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "dispute",
    },
    releaseApproved: {
      type: Boolean,
      default: false,
    },
    clientApproval: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
