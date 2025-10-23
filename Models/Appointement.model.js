const mongoose = require("mongoose");

const AppointmentSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    serviceId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    }],
    vehicleType: { type: String },
    appointmentDate: { type: Date, required: true },
    appointmentTime: { type: String, required: true },
    issue: { type: String, required: true },
    otherIssue: { type: String },
    location: { type: String },
    duration: { type: Number },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
    totalPrice: { type: Number },
    taxAmount: { type: Number },
    platformFee: { type: Number },
    professionalEarnings: { type: Number },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", AppointmentSchema);
