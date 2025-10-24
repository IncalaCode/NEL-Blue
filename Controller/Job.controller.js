const Job = require("../Models/Job.model");
const JobApplication = require("../Models/JobApplication.model");
const asyncHandler = require("express-async-handler");
const { updateUserMetrics } = require("../utils/updateMetrics");

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

  const jobsWithPayload = await Promise.all(jobs.map(async (job) => {
    let hasApplied = false;
    if (req.user && req.user._id) {
      const application = await JobApplication.findOne({ 
        jobId: job._id, 
        userId: req.user._id 
      });
      hasApplied = !!application;
    }
    return {
      ...job.toObject(),
      additionalPayload: {
        hasCurrentUserApplied: hasApplied
      }
    };
  }));

  res.status(200).json({
    success: true,
    pagination: {
      page: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs
    },
    jobs: jobsWithPayload
  });
});

const getAppliedJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const applications = await JobApplication.find({ userId: req.user._id })
    .populate({
      path: "jobId",
      populate: [
        { path: "serviceId" },
        { path: "createdBy", select: "firstName lastName email" }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalJobs = await JobApplication.countDocuments({ userId: req.user._id });

  const jobs = applications.map(app => ({
    ...app.jobId.toObject(),
    additionalPayload: {
      hasCurrentUserApplied: true
    }
  }));

  res.status(200).json({
    success: true,
    pagination: {
      page: parseInt(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs
    },
    jobs
  });
});

const getMyJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const jobs = await Job.find({ createdBy: req.user._id })
    .populate("serviceId")
    .populate("createdBy", "firstName lastName email")
    .sort({ createdAt: -1 })
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
      additionalPayload: {
        hasCurrentUserApplied: false
      }
    }))
  });
});

const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("serviceId").populate("createdBy", "firstName lastName email");
  
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  let hasApplied = false;
  if (req.user && req.user._id) {
    const application = await JobApplication.findOne({ 
      jobId: req.params.id, 
      userId: req.user._id 
    });
    hasApplied = !!application;
  }

  res.status(200).json({
    ...job.toObject(),
    additionalPayload: {
      hasCurrentUserApplied: hasApplied
    }
  });
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

  const existingApplication = await JobApplication.findOne({ jobId: req.params.id, userId: req.user._id });
  if (existingApplication) {
    return res.status(400).json({ success: false, message: "Already applied" });
  }

  // Create JobApplication record
  await JobApplication.create({
    jobId: req.params.id,
    userId: req.user._id,
    status: "pending"
  });

  // Also add to Job's applicants array for backward compatibility
  if (!job.applicants.includes(req.user._id)) {
    job.applicants.push(req.user._id);
    await job.save();
  }

  res.status(200).json({ success: true, message: "Applied successfully" });
});

const getJobApplicants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const job = await Job.findById(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  const applicants = await JobApplication.find({ jobId: req.params.id })
    .populate("userId", "firstName lastName email phone")
    .skip(skip)
    .limit(parseInt(limit));

  const totalApplicants = await JobApplication.countDocuments({ jobId: req.params.id });

  res.status(200).json({
    success: true,
    page: parseInt(page),
    totalPages: Math.ceil(totalApplicants / limit),
    totalApplicants,
    applicants
  });
});

const acceptApplicant = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id).populate("serviceId");

  if (!job) {
    return res.status(404).json({ success: false, message: "Job not found" });
  }

  if (job.createdBy.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  // Update JobApplication status to accepted
  await JobApplication.findOneAndUpdate(
    { jobId: req.params.id, userId: req.params.applicantId },
    { status: "accepted" }
  );

  // Update job status and accepted applicant
  job.acceptedApplicant = req.params.applicantId;
  job.status = "in-progress";
  await job.save();

  // Create appointment from job details
  const Appointment = require("../Models/Appointement.model");
  await Appointment.create({
    userId: job.createdBy, // Client who posted the job
    professionalId: req.params.applicantId, // Accepted professional
    serviceId: [job.serviceId._id],
    appointmentDate: job.appointmentDate,
    appointmentTime: job.appointmentTime,
    issue: job.description,
    location: job.location,
    duration: job.duration,
    status: "Confirmed",
    jobId: job._id
  });

  // Update metrics for both client and professional
  await updateUserMetrics(job.createdBy);
  await updateUserMetrics(req.params.applicantId);

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

  // Delete the JobApplication record
  await JobApplication.findOneAndDelete({
    jobId: req.params.id,
    userId: req.params.applicantId
  });

  // Remove from job applicants array
  job.applicants = job.applicants.filter(id => id.toString() !== req.params.applicantId);
  await job.save();

  res.status(200).json({ success: true, message: "Applicant declined" });
});

const getAllJobApplicants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // Get all active/open jobs for the current user
  const userJobs = await Job.find({ 
    createdBy: req.user._id, 
    status: { $in: ["open", "in-progress"] }
  }).select("_id");

  const jobIds = userJobs.map(job => job._id);

  // Get all applications for these jobs
  const applicants = await JobApplication.find({ jobId: { $in: jobIds } })
    .populate("jobId")
    .populate("userId", "firstName lastName email phone")
    .skip(skip)
    .limit(parseInt(limit));

  const totalApplicants = await JobApplication.countDocuments({ jobId: { $in: jobIds } });

  res.status(200).json({
    success: true,
    page: parseInt(page),
    totalPages: Math.ceil(totalApplicants / limit),
    totalApplicants,
    applicants
  });
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
  declineApplicant,
  getAllJobApplicants
};
