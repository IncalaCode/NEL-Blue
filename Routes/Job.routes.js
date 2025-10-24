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
 *     summary: Get recent job feed (latest first)
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
 * /jobs/my:
 *   get:
 *     summary: Get my posted jobs (by client)
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
 *         description: List of my posted jobs
 */
router.get("/my", protectRoute, getMyJobs);

/**
 * @swagger
 * /jobs/applied:
 *   get:
 *     summary: Get jobs I applied to (by professional)
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
 *         description: List of jobs I applied to
 */
router.get("/applied", protectRoute, getAppliedJobs);

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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 totalApplicants:
 *                   type: integer
 *                 applicants:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       jobId:
 *                         type: string
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           firstName:
 *                             type: string
 *                           lastName:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, rejected]
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       __v:
 *                         type: integer
 *       404:
 *         description: Job not found
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
