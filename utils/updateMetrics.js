const User = require("../Models/User.model");
const Appointment = require("../Models/Appointement.model");
const Advertisement = require("../Models/Advertisement.model");

const updateUserMetrics = async (userId) => {
  try {
    console.log(`📊 Updating metrics for user: ${userId}`);
    
    // Get user to determine role
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return;
    }

    // Count completed appointments
    const completedAppointments = await Appointment.countDocuments({
      $or: [{ userId }, { professionalId: userId }],
      status: "Completed"
    });

    // Count active appointments (Confirmed)
    const activeAppointments = await Appointment.countDocuments({
      $or: [{ userId }, { professionalId: userId }],
      status: "Confirmed"
    });

    // Count pending appointments
    const pendingAppointments = await Appointment.countDocuments({
      $or: [{ userId }, { professionalId: userId }],
      status: "Pending"
    });

    // Count cancelled appointments
    const cancelledAppointments = await Appointment.countDocuments({
      $or: [{ userId }, { professionalId: userId }],
      status: "Cancelled"
    });

    // Count all appointments
    const allAppointments = await Appointment.countDocuments({
      $or: [{ userId }, { professionalId: userId }]
    });

    // Professional-specific metrics
    let advertisedServices = 0;
    let totalClients = 0;
    let totalEarnings = 0;
    
    if (user.role === "Professional") {
      // Count advertised services
      advertisedServices = await Advertisement.countDocuments({
        professionalId: userId
      });

      // Count total unique clients
      const uniqueClients = await Appointment.distinct('userId', { professionalId: userId });
      totalClients = uniqueClients.length;
      
      // Calculate total earnings from completed appointments
      const completedAppointmentsWithEarnings = await Appointment.find({
        professionalId: userId,
        status: "Completed",
        professionalEarnings: { $exists: true }
      });
      
      totalEarnings = completedAppointmentsWithEarnings.reduce((sum, apt) => {
        return sum + (apt.professionalEarnings || 0);
      }, 0);
    }

    // Client-specific metrics
    let totalSpent = 0;
    if (user.role === "Client") {
      const completedClientAppointments = await Appointment.find({
        userId,
        status: "Completed",
        totalPrice: { $exists: true }
      });
      
      totalSpent = completedClientAppointments.reduce((sum, apt) => {
        return sum + (apt.totalPrice || 0);
      }, 0);
    }

    const metrics = {
      completedAppointments,
      activeAppointments,
      pendingAppointments,
      cancelledAppointments,
      allAppointments,
      advertisedServices,
      totalClients,
      totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
      totalSpent: Math.round(totalSpent * 100) / 100,
      lastUpdated: new Date()
    };

    // Update user metrics
    await User.findByIdAndUpdate(userId, { metrics });
    
    console.log(`✅ Updated metrics for ${user.role} ${user.email}:`, metrics);

  } catch (error) {
    console.error(`❌ Error updating user metrics for ${userId}:`, error);
  }
};

module.exports = { updateUserMetrics };