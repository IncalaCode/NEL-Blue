const Advertisement = require("../Models/Advertisement.model");
const asyncHandler = require("express-async-handler");
const { updateUserMetrics } = require("../utils/updateMetrics");

const createAdvertisement = asyncHandler(async (req, res) => {
  const { serviceId, price, location, skills, description, available } = req.body;
  
  if (!serviceId || !price || !location || !description) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const advertisement = await Advertisement.create({
    serviceId,
    professionalId: req.user._id,
    price,
    location,
    skills: skills || [],
    description,
    available: available !== undefined ? available : true
  });

  // Update user metrics
  await updateUserMetrics(req.user._id);

  res.status(201).json({ success: true, message: "Advertisement created successfully", advertisement });
});

const getAdvertisements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const advertisements = await Advertisement.find()
    .populate("serviceId")
    .populate("professionalId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const count = await Advertisement.countDocuments();

  res.status(200).json({
    success: true,
    count,
    data: advertisements
  });
});

const getMyAdvertisements = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const advertisements = await Advertisement.find({ professionalId: req.user._id })
    .populate("serviceId")
    .populate("professionalId", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const count = await Advertisement.countDocuments({ professionalId: req.user._id });

  res.status(200).json({
    success: true,
    count,
    data: advertisements
  });
});

const updateAdvertisement = asyncHandler(async (req, res) => {
  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    return res.status(404).json({ success: false, message: "Advertisement not found" });
  }

  if (advertisement.professionalId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  // Extract allowed fields for update
  const {
    serviceId,
    price,
    location,
    skills,
    description,
    available
  } = req.body;

  const updateData = {};
  if (serviceId) updateData.serviceId = serviceId;
  if (price !== undefined) updateData.price = price;
  if (location) updateData.location = location;
  if (skills) updateData.skills = skills;
  if (description) updateData.description = description;
  if (available !== undefined) updateData.available = available;

  const updatedAdvertisement = await Advertisement.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  ).populate("serviceId").populate("professionalId", "firstName lastName email");

  res.status(200).json({
    success: true,
    message: "Advertisement updated successfully",
    advertisement: updatedAdvertisement
  });
});

const getAdvertisementById = asyncHandler(async (req, res) => {
  const advertisement = await Advertisement.findById(req.params.id)
    .populate("serviceId")
    .populate("professionalId", "firstName lastName email");

  if (!advertisement) {
    return res.status(404).json({ success: false, message: "Advertisement not found" });
  }

  res.status(200).json({
    success: true,
    advertisement
  });
});

const deleteAdvertisement = asyncHandler(async (req, res) => {
  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    return res.status(404).json({ success: false, message: "Advertisement not found" });
  }

  if (advertisement.professionalId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  await Advertisement.findByIdAndDelete(req.params.id);
  
  // Update user metrics
  await updateUserMetrics(req.user._id);
  
  res.status(200).json({ success: true, message: "Advertisement deleted" });
});

module.exports = {
  createAdvertisement,
  updateAdvertisement,
  getAdvertisementById,
  deleteAdvertisement,
  getAdvertisements,
  getMyAdvertisements
};