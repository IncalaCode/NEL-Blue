const mongoose = require("mongoose");

const AdvertisementSchema = new mongoose.Schema(
  {
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    professionalId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    skills: [{ type: String }],
    description: { type: String, required: true },
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Advertisement", AdvertisementSchema);