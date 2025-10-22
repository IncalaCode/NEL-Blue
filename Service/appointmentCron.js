const cron = require('node-cron');
const Appointment = require('../Models/Appointement.model');

const autoCompleteAppointments = async () => {
  try {
    const now = new Date();
    const appointments = await Appointment.find({ status: 'Confirmed' });
    
    for (const appointment of appointments) {
      const appointmentDateTime = new Date(`${appointment.appointmentDate} ${appointment.appointmentTime}`);
      const durationMs = appointment.duration * 60 * 60 * 1000;
      const endTime = new Date(appointmentDateTime.getTime() + durationMs);
      
      if (now > endTime) {
        appointment.status = 'Completed';
        await appointment.save();
        console.log(`✅ Auto-completed appointment ${appointment._id}`);
      }
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
};

const startAppointmentCron = () => {
  cron.schedule('*/30 * * * *', autoCompleteAppointments);
  console.log('⏰ Appointment auto-completion cron job started (runs every 30 minutes)');
};

module.exports = { startAppointmentCron };
