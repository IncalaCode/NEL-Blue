const Service = require("../Models/Service.model");
// Get all jobs
const getAllServices = async (req, res) => {
  try {
    const jobs = await Service.find().sort({ serviceName: 1 });
    res.status(200).json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getAllServices };
