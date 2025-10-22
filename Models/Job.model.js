const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    ratePerHour: { type: Number, required: true },
    location: { type: String, required: true },
    availability: { type: Boolean, default: true },
    skills: [{ type: String }],
    description: { type: String, required: true },
    duration: { type: Number },
    deposit: {
      amount: { type: Number, default: 0 },
      confirmed: { type: Boolean, default: false }
    },
    paymentMethod: { type: String, enum: ["hourly", "milestone"], required: true },
    status: { type: String, enum: ["open", "in-progress", "completed", "cancelled"], default: "open" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    applicants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    acceptedApplicant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    appointmentDate: { type: Date },
    appointmentTime: { type: String }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
