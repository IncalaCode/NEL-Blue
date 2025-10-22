const mongoose = require("mongoose");
const ServiceSchema = new mongoose.Schema(
  {
    serviceName: { type: String, required: true },
    price: {
      min: { type: Number, required: true },
      max: { type: Number, required: true },
    },
    professionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },category: { type: String },
    serviceCode:{type:Number},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Service", ServiceSchema);

