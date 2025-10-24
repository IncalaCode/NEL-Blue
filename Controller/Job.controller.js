const Job = require("../Models/Job.model");
const asyncHandler = require("express-async-handler");

const createJob = asyncHandler(async (req, res) => {
  const { serviceId, ratePerHour, location, skills, description, duration, appointmentDate, appointmentTime } = req.body;
  
  if (!serviceId || !ratePerHour || !location || !description) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const job = await Job.create({
    serviceId,
    ratePerHour,
    location,
    skills: skills || [],
    description,
    duration,
    paymentMethod: "hourly",
    appointmentDate,
    appointmentTime,
    createdBy: req.user._id
  });

  res.status(201).json({ success: true, message: "Job created successfully", job });
});

const getRecentJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const jobs = await Job.find()
    .populate("serviceId")
    .populate("createdBy", "firstName lastName email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
  
  const totalJobs = await Job.countDocuments();

  res.status(200).json({
    success: true,
    pagination: {
      page: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs
    },
    jobs: jobs.map(job => ({
      ...job.toObject(),
      additionalPayload: null
    }))
  });
});

const getAppliedJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const jobs = await Job.find({ applicants: req.user._id })
    .populate("serviceId")
    .populate("createdBy", "firstName lastName email")
    .skip(skip)
    .limit(parseInt(limit));

  const totalJobs = await Job.countDocuments({ applicants: req.user._id });

  res.status(200).json({
    success: true,
    pagination: {
      page: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs
    },
    jobs: jobs.map(job => ({
      ...job.toObject(),
      additionalPayload: null
    }))
  });
});

const getMyJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const jobs = await Job.find({ createdBy: req.user._id })
    .populate("serviceId")
    .populate("createdBy", "firstName lastName email")
    .skip(skip)
    .limit(parseInt(limit));
  
  const totalJobs = await Job.countDocuments({ createdBy: req.user._id });

  res.status(200).json({
    success: true,
    pagination: {
      page: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs
    },
    jobs: jobs.map(job => ({
      ...job.toObject(),
      additionalPayload: null
    }))
  });
});

const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("serviceId").populate("createdBy", "firstName lastName email");
  
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  res.status(200).json(job);
});

const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.status(200).json(updatedJob);
});

const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  await Job.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true, message: "Job deleted" });
});

const applyForJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  if (job.createdBy.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "Cannot apply to your own job" });
  }

  if (job.applicants.includes(req.user._id)) {
    return res.status(400).json({ success: false, message: "Already applied" });
  }

  job.applicants.push(req.user._id);
  await job.save();

  res.status(200).json({ success: true, message: "Applied successfully" });
});

const getJobApplicants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const job = await Job.findById(req.params.id).populate({
    path: "applicants",
    select: "firstName lastName email phone",
    options: { skip, limit: parseInt(limit) }
  });

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  const totalApplicants = job.applicants.length;

  res.status(200).json({
    success: true,
    page: parseInt(page),
    totalPages: Math.ceil(totalApplicants / limit),
    totalApplicants,
    applicants: job.applicants
  });
});

const acceptApplicant = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  job.acceptedApplicant = req.params.applicantId;
  job.status = "in-progress";
  await job.save();

  res.status(200).json({ success: true, message: "Applicant accepted" });
});

const declineApplicant = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  job.applicants = job.applicants.filter(id => id.toString() !== req.params.applicantId);
  await job.save();

  res.status(200).json({ success: true, message: "Applicant declined" });
});

module.exports = {
  createJob,
  getRecentJobs,
  getAppliedJobs,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyForJob,
  getJobApplicants,
  acceptApplicant,
  declineApplicant
};
