const express = require("express");
const router = express.Router();
const { protectRoute, superAdminRoute } = require("../Middleware/Protect.route");
const {
  adminDashboard,
  userDashboard,
  ProjectDashBoard,
  analayticsDashboard,
getAllProjects,

} = require("../Controller/Admin.controller");
const {  adminIntiateSignup,adminLogin,
  adminVerifySignup,adminResendOtp} = require("../Controller/Auth.controller");
/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard endpoints for users, projects, and admins
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         profileImage:
 *           type: string
 *         availabilty:
 *           $ref: '#/components/schemas/Availability'
 *     Availability:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         day:
 *           type: string
 *         startTime:
 *           type: string
 *         endTime:
 *           type: string
 *     Appointment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           $ref: '#/components/schemas/User'
 *         serviceId:
 *           type: object
 *           properties:
 *             title:
 *               type: string
 *             description:
 *               type: string
 *             price:
 *               type: number
 *     Payment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           $ref: '#/components/schemas/User'
 *         services:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               serviceName:
 *                 type: string
 *         paymentStatus:
 *           type: string
 *           enum: [Pending, Paid, Failed]
 *         status:
 *           type: string
 *           enum: [Progress, Completed, Cancelled]
 *         totalPrice:
 *           type: number
 *         createdAt:
 *           type: string
 *           format: date-time
 *     Feedback:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         userId:
 *           $ref: '#/components/schemas/User'
 *         comment:
 *           type: string
 *         rating:
 *           type: number
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get admin dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   type: number
 *                 ongoingPayments:
 *                   type: integer
 *                 completedPayments:
 *                   type: integer
 *                 canceledPayments:
 *                   type: integer
 *                 newUsers:
 *                   type: integer
 *                 taskProgress:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Date in YYYY-MM-DD format
 *                       totalTasks:
 *                         type: integer
 *                 recentPayments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Only super admins can access
 *       500:
 *         description: Internal server error
 */
router.get(
  "/dashboard",
  protectRoute,
  superAdminRoute,
  adminDashboard
);

/**
 * @swagger
 * /admin/dashboard/user:
 *   get:
 *     summary: Get logged-in user dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 feedbacks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalPayments:
 *                       type: integer
 *                     totalFeedbacks:
 *                       type: integer
 *                     avgRating:
 *                       type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard/user", protectRoute, userDashboard);

/**
 * @swagger
 * /admin/dashboard/project:
 *   get:
 *     summary: Get project/appointment dashboard for logged-in user
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *                 payments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Payment'
 *                 feedbacks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalProjects:
 *                       type: integer
 *                     totalPayments:
 *                       type: integer
 *                     totalFeedbacks:
 *                       type: integer
 *                     avgRating:
 *                       type: string
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard/project", protectRoute, ProjectDashBoard);

/**
 * @swagger
 * /admin/dashboard/analytics:
 *   get:
 *     summary: Get analytics dashboard
 *     description: Retrieve revenue breakdown (deposit/withdrawal), task progress (daily, weekly, monthly), and client vs professional registrations per day.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 revenue:
 *                   type: object
 *                   properties:
 *                     deposits:
 *                       type: number
 *                       example: 12000
 *                     withdrawals:
 *                       type: number
 *                       example: 3000
 *                     net:
 *                       type: number
 *                       example: 9000
 *                 tasks:
 *                   type: object
 *                   properties:
 *                     daily:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           day:
 *                             type: string
 *                             example: "Sunday"
 *                           total:
 *                             type: number
 *                             example: 5
 *                     weekly:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           week:
 *                             type: number
 *                             example: 34
 *                           total:
 *                             type: number
 *                             example: 25
 *                     monthly:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: number
 *                             example: 8
 *                           total:
 *                             type: number
 *                             example: 120
 *                 clientProfessional:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       day:
 *                         type: string
 *                         example: "Monday"
 *                       Client:
 *                         type: number
 *                         example: 10
 *                       Professional:
 *                         type: number
 *                         example: 5
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Internal server error
 */
router.get("/dashboard/analytics", protectRoute, superAdminRoute, analayticsDashboard);
/**
 * @swagger
 * /admin/signup/initiate:
 *   post:
 *     summary: Initiate admin signup
 *     description: Sends a 6-digit verification code (OTP) to the provided email and stores signup data temporarily in Redis for 15 minutes.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Surafel"
 *               lastName:
 *                 type: string
 *                 example: "Wondu"
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 example: "StrongPassword123!"
 *               country:
 *                 type: string
 *                 example: "Ethiopia"
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Verification code sent successfully"
 *       400:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 */
router.post("/signup/initiate", adminIntiateSignup);


/**
 * @swagger
 * /admin/signup/verify:
 *   post:
 *     summary: Verify OTP and complete admin signup
 *     description: Validates the OTP sent to the email. If valid, creates an admin account and deletes temporary Redis data.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       201:
 *         description: Admin account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Admin account created successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64f9b0c2d7a45e1d8a9c1f23"
 *                     email:
 *                       type: string
 *                       example: "admin@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "Surafel"
 *                     lastName:
 *                       type: string
 *                       example: "Wondu"
 *                     role:
 *                       type: string
 *                       example: "Admin"
 *       400:
 *         description: Invalid verification code, session expired, or user already exists
 *       500:
 *         description: Internal server error
 */
router.post("/signup/verify", adminVerifySignup);
/**
 * @swagger
 * /admin/signup/resend-otp:
 *   post:
 *     summary: Resend OTP for admin signup
 *     description: Resends a new OTP to the user's email and updates the Redis signup session.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@example.com"
 *     responses:
 *       200:
 *         description: New verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "New verification code sent successfully"
 *       400:
 *         description: Signup session expired or invalid
 *       500:
 *         description: Internal server error
 */

router.post("/signup/resend-otp", adminResendOtp);

/**
 * @swagger
 * /admin/getallProjects:
 *   get:
 *     summary: Get all projects (appointments)
 *     description: Retrieve all projects with related user, service, payments, and feedback information. Only accessible to Super Admins.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 projects:
 *                   type: array
 *                   description: List of all projects with details
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1b27e1a0e4c9a2b123456"
 *                       userId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64f1a9b91a0e4c9a2b654321"
 *                           firstName:
 *                             type: string
 *                             example: "John"
 *                           lastName:
 *                             type: string
 *                             example: "Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                           role:
 *                             type: string
 *                             example: "Client"
 *                           profileImage:
 *                             type: string
 *                             example: "https://example.com/image.jpg"
 *                       serviceId:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "64f1c4f11a0e4c9a2b987654"
 *                           title:
 *                             type: string
 *                             example: "Web Development"
 *                           description:
 *                             type: string
 *                             example: "Full-stack web development services"
 *                           price:
 *                             type: number
 *                             example: 500
 *                 payments:
 *                   type: array
 *                   description: Related payments for projects
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1d7a41a0e4c9a2b765432"
 *                       totalPrice:
 *                         type: number
 *                         example: 500
 *                       paymentStatus:
 *                         type: string
 *                         example: "Paid"
 *                 feedbacks:
 *                   type: array
 *                   description: Related feedbacks for projects
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "64f1e8b71a0e4c9a2b246810"
 *                       rating:
 *                         type: number
 *                         example: 4.5
 *                       comment:
 *                         type: string
 *                         example: "Great service and communication."
 *                       userId:
 *                         type: object
 *                         properties:
 *                           firstName:
 *                             type: string
 *                             example: "Alice"
 *                           lastName:
 *                             type: string
 *                             example: "Smith"
 *                           email:
 *                             type: string
 *                             example: "alice@example.com"
 *                           profileImage:
 *                             type: string
 *                             example: "https://example.com/alice.jpg"
 *                 stats:
 *                   type: object
 *                   description: Overall statistics
 *                   properties:
 *                     totalProjects:
 *                       type: integer
 *                       example: 25
 *                     totalPayments:
 *                       type: integer
 *                       example: 20
 *                     totalFeedbacks:
 *                       type: integer
 *                       example: 15
 *                     avgRating:
 *                       type: number
 *                       example: 4.3
 *       401:
 *         description: Unauthorized - Token missing or invalid
 *       403:
 *         description: Forbidden - Only Super Admins can access this
 *       500:
 *         description: Internal server error
 */

router.get("/getallProjects", protectRoute, superAdminRoute, getAllProjects);
/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin login
 *     description: Authenticate an admin or super admin user and return access/refresh tokens.
 *     tags: [Admin]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Admin@12345"
 *     responses:
 *       200:
 *         description: Successfully logged in as admin
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Admin logged in successfully"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64f1b27e1a0e4c9a2b123456"
 *                     firstName:
 *                       type: string
 *                       example: "Super"
 *                     lastName:
 *                       type: string
 *                       example: "Admin"
 *                     email:
 *                       type: string
 *                       example: "admin@example.com"
 *                     role:
 *                       type: string
 *                       example: "superAdmin"
 *                 accessToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       400:
 *         description: Invalid credentials (wrong email or password)
 *       403:
 *         description: Forbidden - Only admin/super admin accounts can log in here
 *       500:
 *         description: Internal server error
 */

router.post("/login",adminLogin)
module.exports = router;
