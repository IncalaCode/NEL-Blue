const mongoose = require("mongoose");
const FeedBackSchema = mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: { type: Number, required: true },
        feedback: { type: String, required: true },
    },
    { timestamps: true }
);
module.exports = mongoose.model("FeedBack", FeedBackSchema);