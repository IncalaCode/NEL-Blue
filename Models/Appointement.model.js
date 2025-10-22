const mongoose = require("mongoose");

const AppointmentSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    serviceId: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    }],
    categories: {
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
    otherIssue: { type: String },
    budget: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Confirmed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// ✅ Use the correct model name here
module.exports = mongoose.model("Appointment", AppointmentSchema);
