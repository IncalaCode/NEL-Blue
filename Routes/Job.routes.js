const express = require("express");
const router = express.Router();
const { protectRoute } = require("../Middleware/Protect.route");
const {
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
} = require("../Controller/Job.controller");

/**
 * @swagger
 * tags:
 *   name: Jobs
 *   description: Job management endpoints
 */

/**
 * @swagger
 * /jobs:
 *   post:
 *     summary: Create a new job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - serviceId
 *               - ratePerHour
 *               - location
 *               - description
 *               - paymentMethod
 *             properties:
 *               serviceId:
 *                 type: string
 *               ratePerHour:
 *                 type: number
 *               location:
 *                 type: string
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *               description:
 *                 type: string
 *               duration:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [hourly, milestone]
 *               appointmentDate:
 *                 type: string
 *               appointmentTime:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job created successfully
 */
router.post("/", protectRoute, createJob);

/**
 * @swagger
 * /jobs/recent:
 *   get:
 *     summary: Get recent job posts (paginated)
 *     tags: [Jobs]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of recent jobs
 */
router.get("/recent", getRecentJobs);

/**
 * @swagger
 * /jobs/applied:
 *   get:
 *     summary: Get jobs the logged-in user has applied for (paginated)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of jobs the user has applied for
 *       401:
 *         description: Unauthorized
 */
router.get("/applied", protectRoute, getAppliedJobs);

/**
 * @swagger
 * /jobs/my:
 *   get:
 *     summary: Get my posted jobs (paginated)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of my jobs
 */
router.get("/my", protectRoute, getMyJobs);

/**
 * @swagger
 * /jobs/{id}:
 *   get:
 *     summary: Get a job by ID
 *     tags: [Jobs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job details
 *       404:
 *         description: Job not found
 */
router.get("/:id", getJobById);

/**
 * @swagger
 * /jobs/{id}:
 *   put:
 *     summary: Edit a posted job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job updated successfully
 *       404:
 *         description: Job not found
 */
router.put("/:id", protectRoute, updateJob);

/**
 * @swagger
 * /jobs/{id}:
 *   delete:
 *     summary: Delete a posted job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Job deleted successfully
 *       404:
 *         description: Job not found
 */
router.delete("/:id", protectRoute, deleteJob);

/**
 * @swagger
 * /jobs/{id}/apply:
 *   post:
 *     summary: Apply for a job
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applied successfully
 *       400:
 *         description: Already applied or self-application
 *       404:
 *         description: Job not found
 */
router.post("/:id/apply", protectRoute, applyForJob);

/**
 * @swagger
 * /jobs/{id}/applicants:
 *   get:
 *     summary: Get job applicants (paginated)
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of job applications
 */
router.get("/:id/applicants", protectRoute, getJobApplicants);

/**
 * @swagger
 * /jobs/{id}/applicants/{applicantId}/accept:
 *   post:
 *     summary: Accept a job applicant
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: applicantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applicant accepted
 */
router.post("/:id/applicants/:applicantId/accept", protectRoute, acceptApplicant);

/**
 * @swagger
 * /jobs/{id}/applicants/{applicantId}/decline:
 *   post:
 *     summary: Decline a job applicant
 *     tags: [Jobs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: applicantId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applicant declined
 */
router.post("/:id/applicants/:applicantId/decline", protectRoute, declineApplicant);

module.exports = router;
