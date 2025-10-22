//getappountment
const asyncHandler = require("express-async-handler");
const Appointment = require("../Models/Appointement.model");
const Service= require("../Models/Service.model");
const Payment=require("../Models/Payment.model")
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const getAppointment = asyncHandler(async (req, res) => {
  try {
    const appointments = await Appointment.find({ userId: req.user._id })
      .populate({
        path: "serviceId",
        select: "serviceName availability", // select fields you want
      });

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Get Appointment Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
const deleteAppointement = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or not yours" });
    }

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Delete Appointment Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
const getHistory = asyncHandler(async (req, res) => {
  try {
    const history = await Appointment.find({
      userId: req.user._id,
      status: { $in: ["Confirmed", "Cancelled"] },
    }).populate("serviceId", "serviceName");

    res.status(200).json(history);
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
const addAppointment = asyncHandler(async (req, res) => {
  const {
    serviceId,
    professionalId,
    vehicleType,
    appointmentDate,
    appointmentTime,
    issue,
    otherIssue,
    location,
    duration
  } = req.body;

  if (!serviceId || !professionalId || !appointmentDate || !appointmentTime || !issue || !duration) {
    return res.status(400).json({ success: false, message: "All required fields must be provided" });
  }

  const User = require("../Models/User.model");
  const Tax = require("../Models/Tax.model");
  
  const professional = await User.findById(professionalId);
  if (!professional || professional.role !== "Professional") {
    return res.status(404).json({ success: false, message: "Professional not found" });
  }

  const taxConfig = await Tax.findOne().sort({ createdAt: -1 });
  const taxPercentage = taxConfig?.taxPercentage || 8;
  const platformFeePercentage = taxConfig?.platformFeePercentage || 10;

  const hourlyRate = professional.hourlyRate || 0;
  const basePrice = hourlyRate * duration;
  const platformFee = (basePrice * platformFeePercentage) / 100;
  const taxAmount = (basePrice * taxPercentage) / 100;
  const totalPrice = basePrice + platformFee + taxAmount;
  const professionalEarnings = basePrice - platformFee;

  const newAppointment = await Appointment.create({
    userId: req.user._id,
    professionalId,
    serviceId,
    vehicleType,
    appointmentDate,
    appointmentTime,
    issue,
    otherIssue,
    location,
    duration,
    totalPrice,
    taxAmount,
    platformFee,
    professionalEarnings,
    status: "Pending"
  });

  const payment = await Payment.create({
    client: req.user._id,
    professional: professionalId,
    appointment: newAppointment._id,
    amount: totalPrice,
    platformFee,
    professionalEarnings,
    currency: "USD",
    status: "pending_payment"
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(totalPrice * 100),
    currency: "usd",
    metadata: {
      appointmentId: newAppointment._id.toString(),
      paymentId: payment._id.toString(),
    },
  });

  payment.paymentIntentId = paymentIntent.id;
  await payment.save();

  res.status(201).json({
    success: true,
    message: "Appointment created successfully",
    appointment: newAppointment,
    clientSecret: paymentIntent.client_secret
  });
});


const updateProjectStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    project.status = status;
    await project.save();
    res.status(200).json({ message: "Project status updated successfully" });
  } catch (error) {
    console.error("Update Project Status Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
})
const calculateAppointmentCost = asyncHandler(async (req, res) => {
  try {
    const { professionalId, duration } = req.body;

    const User = require("../Models/User.model");
    const Tax = require("../Models/Tax.model");
    
    const professional = await User.findById(professionalId);
    if (!professional || professional.role !== "Professional") {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }

    const taxConfig = await Tax.findOne().sort({ createdAt: -1 });
    const taxPercentage = taxConfig?.taxPercentage || 8;
    const platformFeePercentage = taxConfig?.platformFeePercentage || 10;

    const hourlyRate = professional.hourlyRate || 0;
    const basePrice = hourlyRate * duration;
    const platformFee = (basePrice * platformFeePercentage) / 100;
    const taxAmount = (basePrice * taxPercentage) / 100;
    const totalPrice = basePrice + platformFee + taxAmount;
    const professionalEarnings = basePrice - platformFee;

    res.status(200).json({
      success: true,
      message: "Cost calculated successfully",
      data: {
        professionalId,
        hourlyRate,
        duration,
        basePrice,
        taxPercentage,
        taxAmount,
        platformFeePercentage,
        platformFee,
        totalPrice,
        professionalEarnings
      }
    });
  } catch (error) {
    console.error("Calculate Cost Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

module.exports = { getAppointment, deleteAppointement ,addAppointment,getHistory,updateProjectStatus, calculateAppointmentCost};
