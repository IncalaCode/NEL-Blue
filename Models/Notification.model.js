const mongoose = require("mongoose");
const NotificationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    catagories: {
      type: String,
      required: true,
    },
    vehicleType: {
      type: String,
      required: true,
    },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    issue: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);
module.exports = mongoose.model("Notification", NotificationSchema);
