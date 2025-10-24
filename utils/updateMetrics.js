const User = require("../Models/User.model");
const Appointment = require("../Models/Appointement.model");
const Advertisement = require("../Models/Advertisement.model");

const updateUserMetrics = async (userId) => {
  try {
    // Count completed appointments
    const completedAppointments = await Appointment.countDocuments({
      $or: [{ userId }, { professionalId: userId }],
      status: "Completed"
    });

    // Count active appointments
    const activeAppointments = await Appointment.countDocuments({
      $or: [{ userId }, { professionalId: userId }],
      status: "Confirmed"
    });

    // Count advertised services
    const advertisedServices = await Advertisement.countDocuments({
      professionalId: userId
    });

    // Count all appointments
    const allAppointments = await Appointment.countDocuments({
      $or: [{ userId }, { professionalId: userId }]
    });

    // Update user metrics
    await User.findByIdAndUpdate(userId, {
      metrics: {
        completedAppointments,
        activeAppointments,
        advertisedServices,
        allAppointments
      }
    });

  } catch (error) {
    console.error("Error updating user metrics:", error);
  }
};

module.exports = { updateUserMetrics };