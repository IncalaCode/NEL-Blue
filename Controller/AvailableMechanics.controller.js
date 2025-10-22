const User=require("../Models/User.model");
const UserDTO = require("../dto/UserDTO");
const Service=require("../Models/Service.model")
const Feedback=require("../Models/FeedBack.model")
const asyncHandler = require("express-async-handler");
const getAvailableMechanics = asyncHandler(async (req, res) => {
  try {
    // Get all mechanics without sensitive info
    const mechanics = await User.find({ role: "Professional" })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("services");

    // Build detailed mechanic list
    const mechanicDetails = await Promise.all(
      mechanics.map(async (mechanic) => {
        const services = await Service.find({ professionalId: mechanic._id })
          .select("serviceName price availability");

        // Calculate average feedback rating
        const feedbacks = await Feedback.find({ userId: mechanic._id });
        const avgRating =
          feedbacks.length > 0
            ? (
                feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
              ).toFixed(1)
            : null;

        return {
          ...UserDTO.toResponse(mechanic),
          averageRating: avgRating,
          totalFeedbacks: feedbacks.length,
        };
      })
    );

    res.status(200).json(mechanicDetails);
  } catch (error) {
    console.error("Get Mechanics Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
module.exports = {
        getAvailableMechanics
}