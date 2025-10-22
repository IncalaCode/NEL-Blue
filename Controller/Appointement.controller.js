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
    catagories,
    vehicleType,
    appointmentDate,
    appointmentTime,
    issue,
    otherIssue,
    budget,
  } = req.body;

  if (
    !serviceId ||
    !catagories ||
    !vehicleType ||
    !appointmentDate ||
    !appointmentTime ||
    !issue ||
    !budget
  ) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  // Check service existence and availability omitted for brevity (keep your logic)

  // 1. Create appointment
  const newAppointment = await Appointment.create({
    userId: req.user._id,
    serviceId,
    catagories,
    vehicleType,
    appointmentDate,
    appointmentTime,
    issue,
    otherIssue,
    budget,
  });

  // 2. Create Payment record (Pending)
  const payment = await Payment.create({
    userId: req.user._id,
    appointmentId: newAppointment._id,
    services: [serviceId], // can be multiple if you want
    totalPrice: budget,
    currency: "USD", // or dynamic
    paymentStatus: "Pending",
    provider: "Stripe",
  });

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(budget * 100), // in cents
    currency: "usd",
    metadata: {
      appointmentId: newAppointment._id.toString(),
      paymentId: payment._id.toString(),
    },
  });

  // 4. Save PaymentIntent id to payment record
  payment.paymentIntentId = paymentIntent.id;
  await payment.save();

  // 5. Return client secret to frontend to complete payment
  res.status(201).json({
    message: "Appointment created successfully. Complete payment to confirm.",
    appointment: newAppointment,
    clientSecret: paymentIntent.client_secret,
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
module.exports = { getAppointment, deleteAppointement ,addAppointment,getHistory,updateProjectStatus};
