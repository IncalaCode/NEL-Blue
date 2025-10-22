const mongoose = require("mongoose");

const TaxSchema = new mongoose.Schema(
  {
    taxPercentage: { type: Number, required: true, default: 13 },
    platformFeePercentage: { type: Number, required: true, default: 10 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tax", TaxSchema);
