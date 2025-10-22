//getProfile,updatePassword,addService,editService 

const User = require("../Models/User.model");
const asyncHandler = require("express-async-handler");
const Service= require("../Models/Service.model");

const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .populate("services", "serviceName price availability");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
});

const updatePassword = asyncHandler(async (req, res) => {
    const { email } = req.user;
    const { oldPassword, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
    }
    user.password = newPassword; // ✅ Correct field name
    await user.save();
    res.status(200).json({ message: "Password updated successfully" });
});
const addService = asyncHandler(async (req, res) => {
  const { serviceName, price, availability } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  const service = await Service.create({
    serviceName,
    price,
    professionalId: req.user.id,
    availability: availability || undefined,
  });

  // ✅ Push to services array since it's now in User schema
  user.services.push(service._id);
  await user.save();

  res.status(201).json({
    message: "Service added successfully",
    service,
  });
});


// ✅ Edit existing service and availability
const editService = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { serviceName, price, availability } = req.body;

    const service = await Service.findById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    if (String(service.professionalId) !== String(req.user.id)) {
        return res.status(403).json({ message: "Unauthorized to edit this service" });
    }

    service.serviceName = serviceName || service.serviceName;
    service.price = price || service.price;
    if (availability) {
        service.availability = availability;
    }

    await service.save();

    res.status(200).json({ message: "Service updated successfully", service });
});
const addSpecialization = asyncHandler(async (req, res) => {
    const { specialization } = req.body;

    if (!specialization || !Array.isArray(specialization)) {
        return res.status(400).json({ message: "Specialization must be an array" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role !== "Mechanic") {
        return res.status(403).json({ message: "Only Mechanics can add specializations" });
    }

    user.specialization = [...new Set([...user.specialization, ...specialization])];
    await user.save();

    res.status(200).json({
        message: "Specialization(s) added successfully",
        specialization: user.specialization,
    });
});
module.exports = {
    getProfile,
    updatePassword,
    addService,
    editService,
    addSpecialization
};