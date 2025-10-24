const Advertisement = require("../Models/Advertisement.model");
const asyncHandler = require("express-async-handler");

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

const deleteAdvertisement = asyncHandler(async (req, res) => {
  const advertisement = await Advertisement.findById(req.params.id);

  if (!advertisement) {
    return res.status(404).json({ success: false, message: "Advertisement not found" });
  }

  if (advertisement.professionalId.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  await Advertisement.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Advertisement deleted" });
});

module.exports = {
  createAdvertisement,
  deleteAdvertisement,
  getAdvertisements,
  getMyAdvertisements
};