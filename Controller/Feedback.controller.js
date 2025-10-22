// getFeedback,addFeedback
const Feedback = require("../Models/FeedBack.model");
const asyncHandler = require("express-async-handler");
const Appointment = require("../Models/Appointement.model");
const User=require("../Models/User.model")
const getFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const feedback = await Feedback.find({ userId })
    .populate("userId", "firstName lastName email profileImage"); // only select needed fields

  res.status(200).json(feedback);
});

const addFeedback = asyncHandler(async (req, res) => {
  const userId = req.user._id; 
  const { mechanicId, rating, feedback } = req.body;

  if (!mechanicId || !rating || !feedback) {
    return res.status(400).json({ message: "Mechanic, rating, and feedback are required" });
  }

  // ✅ Verify user had a confirmed appointment with this mechanic
  const appointment = await Appointment.findOne({
    userId,
    status: "Confirmed",
  }).populate({
    path: "serviceIds", // because we made it multiple
    match: { professionalId: mechanicId },
  });

  if (!appointment || !appointment.serviceIds || appointment.serviceIds.length === 0) {
    return res.status(403).json({
      message: "You can only provide feedback for mechanics you have successfully booked",
    });
  }

  // ✅ Save feedback
  const newFeedback = await Feedback.create({
    userId,
    mechanicId,
    rating,
    feedback,
  });

  // ✅ Calculate new average rating for this mechanic
  const avgRating = await Feedback.aggregate([
    { $match: { mechanicId } },
    { $group: { _id: "$mechanicId", averageRating: { $avg: "$rating" } } },
  ]);

  const finalAvgRating = avgRating.length > 0 ? avgRating[0].averageRating : rating;

  // ✅ Update mechanic's (user) rating field
  await User.findByIdAndUpdate(mechanicId, { rating: finalAvgRating });

  const populatedFeedback = await newFeedback.populate("userId", "firstName lastName email");

  res.status(201).json({
    message: "Feedback submitted successfully",
    populatedFeedback,
    updatedRating: finalAvgRating,
  });
});


module.exports = { getFeedback, addFeedback };