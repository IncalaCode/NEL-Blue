const cron = require('node-cron');
const Appointment = require('../Models/Appointement.model');

const autoCompleteAppointments = async () => {
  try {
    const now = new Date();
    const appointments = await Appointment.find({ status: 'Confirmed' });
    
    let completedCount = 0;
    
    for (const appointment of appointments) {
      try {
        // Parse appointment date and time properly
        const appointmentDate = new Date(appointment.appointmentDate);
        const [hours, minutes] = appointment.appointmentTime.split(':').map(Number);
        
        // Create appointment start time
        const appointmentStart = new Date(appointmentDate);
        appointmentStart.setHours(hours, minutes, 0, 0);
        
        // Calculate end time (duration is in hours)
        const durationMs = (appointment.duration || 1) * 60 * 60 * 1000;
        const endTime = new Date(appointmentStart.getTime() + durationMs);
        
        console.log(`Checking appointment ${appointment._id}:`);
        console.log(`  Start: ${appointmentStart.toISOString()}`);
        console.log(`  End: ${endTime.toISOString()}`);
        console.log(`  Now: ${now.toISOString()}`);
        console.log(`  Should complete: ${now > endTime}`);
        
        if (now > endTime) {
          appointment.status = 'Completed';
          await appointment.save();
          completedCount++;
          console.log(`✅ Auto-completed appointment ${appointment._id}`);
          
          // Update metrics for both users
          const { updateUserMetrics } = require('../utils/updateMetrics');
          await updateUserMetrics(appointment.userId);
          await updateUserMetrics(appointment.professionalId);
        }
      } catch (appointmentError) {
        console.error(`❌ Error processing appointment ${appointment._id}:`, appointmentError);
      }
    }
    
    console.log(`🔄 Cron job completed. Processed ${appointments.length} appointments, completed ${completedCount}`);
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
};

const startAppointmentCron = () => {
  cron.schedule('*/30 * * * *', autoCompleteAppointments);
  console.log('⏰ Appointment auto-completion cron job started (runs every 30 minutes)');
};

module.exports = { startAppointmentCron };
