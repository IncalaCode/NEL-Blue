const User=require("../Models/User.model");
const UserDTO = require("../dto/UserDTO");
const Service=require("../Models/Service.model")
const Feedback=require("../Models/FeedBack.model")
const asyncHandler = require("express-async-handler");

const getAvailableMechanics = asyncHandler(async (req, res) => {
  try {
    const mechanics = await User.find({ role: "Professional" })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("services");

    const mechanicDetails = await Promise.all(
      mechanics.map(async (mechanic) => {
        const services = await Service.find({ professionalId: mechanic._id })
          .select("serviceName price availability");

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

const getProfessionalsByCategory = asyncHandler(async (req, res) => {
  try {
    const { serviceName, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const service = await Service.findOne({ serviceName });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    const professionals = await User.find({
      role: "Professional",
      services: service._id
    })
      .populate("services")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      role: "Professional",
      services: service._id
    });

    res.status(200).json({
      success: true,
      message: "Professionals retrieved successfully",
      locationUsed: {
        lat: null,
        long: null,
        country: null,
        region: null,
        city: null
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: professionals.map(p => UserDTO.toResponse(p))
    });
  } catch (error) {
    console.error("Get Professionals By Category Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

module.exports = {
  getAvailableMechanics,
  getProfessionalsByCategory
}