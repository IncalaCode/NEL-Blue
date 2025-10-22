// getNotification, acceptNotification,  rejectNotification,
const Notification = require("../Models/Notification.model");
const User = require("../Models/User.model");
const asyncHandler = require("express-async-handler");
const getNotification = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "userId is required" });
  }

  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Invalid userId format" });
  }

  const notifications = await Notification.find({ userId });

  if (!notifications.length) {
    return res.status(404).json({ message: "No notifications found" });
  }

  res.status(200).json(notifications);
});

const acceptNotification = asyncHandler(async (req, res) => {
  const {
    userId,
    catagories,
    vehicleType,
    appointmentDate,
    appointmentTime,
    issue,
  } = req.body;

  // Validate required fields
  if (
    !userId ||
    !catagories ||
    !vehicleType ||
    !appointmentDate ||
    !appointmentTime ||
    !issue
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Optionally validate ObjectId format for userId
  if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Invalid userId format" });
  }

  const notification = await Notification.create({
    userId,
    catagories,
    vehicleType,
    appointmentDate,
    appointmentTime,
    issue,
  });

  res.status(201).json({
    message: "Notification created successfully",
    notification,
  });
});
const rejectNotification = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Notification id is required" });
  }

  if (!id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Invalid notification id format" });
  }

  const notification = await Notification.findById(id);

  if (!notification) {
    return res.status(404).json({ message: "Notification not found" });
  }

  notification.paymentStatus = "Cancelled";

  await notification.save();

  res.status(200).json({
    message: "Notification cancelled successfully",
    notification,
  });
});
module.exports={
    getNotification,
    acceptNotification,
    rejectNotification
}
   
  