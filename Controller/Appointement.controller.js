//getappountment
const asyncHandler = require("express-async-handler");
const Appointment = require("../Models/Appointement.model");
const Service= require("../Models/Service.model");
const Payment=require("../Models/Payment.model")
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const getAppointment = asyncHandler(async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    const total = await Appointment.countDocuments(query);

    const appointments = await Appointment.find(query)
      .populate({
        path: "userId",
        populate: { path: "services" }
      })
      .populate({
        path: "professionalId",
        populate: { path: "services" }
      })
      .populate("serviceId", "serviceName category price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get Appointment Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {
      userId: req.user._id,
      status: { $in: ["Confirmed", "Cancelled"] },
    };
    const total = await Appointment.countDocuments(query);

    const history = await Appointment.find(query)
      .populate({
        path: "userId",
        populate: { path: "services" }
      })
      .populate({
        path: "professionalId",
        populate: { path: "services" }
      })
      .populate("serviceId", "serviceName category price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: history,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});
const addAppointment = asyncHandler(async (req, res) => {
  try {
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

    const serviceIds = Array.isArray(serviceId) ? serviceId : [serviceId];

    const User = require("../Models/User.model");
    const Tax = require("../Models/Tax.model");
    
    const professional = await User.findById(professionalId);
    if (!professional || professional.role !== "Professional") {
      return res.status(404).json({ success: false, message: "Professional not found" });
    }

    if (!professional.hourlyRate || professional.hourlyRate <= 0) {
      return res.status(400).json({ success: false, message: "Professional hourly rate not set" });
    }

    const taxConfig = await Tax.findOne().sort({ createdAt: -1 });
    const taxPercentage = taxConfig?.taxPercentage || 8;
    const platformFeePercentage = taxConfig?.platformFeePercentage || 10;

    const hourlyRate = professional.hourlyRate;
    const basePrice = hourlyRate * duration;
    const platformFee = (basePrice * platformFeePercentage) / 100;
    const taxAmount = (basePrice * taxPercentage) / 100;
    const totalPrice = basePrice + platformFee + taxAmount;
    const professionalEarnings = basePrice - platformFee;

    const newAppointment = await Appointment.create({
      userId: req.user._id,
      professionalId,
      serviceId: serviceIds,
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
  } catch (error) {
    console.error("Add Appointment Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
  }
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

const getAppointmentsByStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const statusMap = {
      requests: "Pending",
      active: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled"
    };

    const dbStatus = statusMap[status];
    if (!dbStatus) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const query = { userId: req.user._id, status: dbStatus };
    const total = await Appointment.countDocuments(query);
    
    const appointments = await Appointment.find(query)
      .populate({
        path: "userId",
        populate: { path: "services" }
      })
      .populate({
        path: "professionalId",
        populate: { path: "services" }
      })
      .populate("serviceId", "serviceName category price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get Appointments By Status Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

const confirmAppointment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    appointment.status = "Confirmed";
    await appointment.save();

    res.status(200).json({ success: true, message: "Appointment confirmed" });
  } catch (error) {
    console.error("Confirm Appointment Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

const rejectAppointment = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    if (appointment.professionalId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    appointment.status = "Cancelled";
    await appointment.save();

    res.status(200).json({ success: true, message: "Appointment rejected" });
  } catch (error) {
    console.error("Reject Appointment Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

module.exports = { getAppointment, deleteAppointement ,addAppointment,getHistory,updateProjectStatus, calculateAppointmentCost, getAppointmentsByStatus, confirmAppointment, rejectAppointment};
