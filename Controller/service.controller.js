const Service = require("../Models/Service.model");
const ServiceDTO = require("../dto/ServiceDTO");

const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ serviceName: 1 });
    res.status(200).json(ServiceDTO.toResponseArray(services));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllServices };
