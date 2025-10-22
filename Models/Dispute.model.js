const mongoose = require("mongoose");

const disputeSchema = new mongoose.Schema({
  raisedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  images: [{ 
    type: String 
  }],
  status: {
    type: String,
    enum: ["pending", "under_review", "resolved", "refunded"],
    default: "pending"
  },
  resolution: String,
  resolvedAt: Date
}, { timestamps: true });
module.exports = mongoose.model("dispute", disputeSchema);
