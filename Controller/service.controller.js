const Service = require("../Models/Service.model");
const ServiceDTO = require("../dto/ServiceDTO");

const getAllServices = async (req, res) => {
  try {
    console.log('📋 Fetching all services...');
    const services = await Service.find().sort({ serviceName: 1 });
    console.log(`✅ Found ${services.length} services`);
    
    const responseData = ServiceDTO.toResponseArray(services);
    if (services.length === 0) {
      return res.status(200).json({ 
        success: true,
        data: [],
        count: 0,
        message: 'No services available at the moment'
      });
    }
    
    res.status(200).json({ 
      success: true,
      data: responseData,
      count: services.length 
    });
  } catch (err) {
    console.error('❌ Error fetching services:', err);
    res.status(200).json({ 
      success: false,
      data: [],
      count: 0,
      error: err.message,
      message: 'Services temporarily unavailable'
    });
  }
};

module.exports = { getAllServices };
