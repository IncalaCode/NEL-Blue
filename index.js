const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const db = require("./config/db.config");
const { swaggerUi, swaggerSpec } = require("./swagger");
const { init: initSocket } = require("./socket");
const { handleWebhook } = require("./Controller/Auth.controller");

// Initialize app
const app = express();

// === Connect DB ===
db();

// === Middleware (order is important) ===

// ✅ Stripe webhook must be raw, and registered BEFORE express.json
/**
 * @swagger
 * /auth/webhook:
 *   post:
 *     summary: Stripe Webhook endpoint
 *     tags: [Webhook]
 *     description: |
 *       Handles Stripe webhook events including:
 *       - `payment_intent.succeeded`
 *       - `payment_intent.payment_failed`
 *       - `account.updated`
 *       - `identity.verification_session.verified`
 *       For Postman testing, signature verification can be skipped.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               id: evt_test_webhook
 *               object: event
 *               type: identity.verification_session.verified
 *               data:
 *                 object:
 *                   id: vs_1RxCATPfjXlwgFldE4wkKIEw
 *                   identityVerified: true
 *                   metadata:
 *                     email: surafelwondu47@gmail.com
 *     responses:
 *       200:
 *         description: Webhook received successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 received:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Webhook processing error
 */
app.post(
  "/api/auth/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook
);


const allowedOrigins = [
  "https://nel-blue-admin-dashboard.vercel.app",
  process.env.CLIENT_URL,
 "http://localhost:5000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(cookieParser());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// Swagger Docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// === Static Files ===
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// === Routes ===
const AuthRoute = require("./Routes/Auth.route");
const AppointementRoute = require("./Routes/Appointement.routes");
const FeedbackRoute = require("./Routes/Feedback.routes");
const DisputeRoute = require("./Routes/Dispute.routes");
const NotificationRoute = require("./Routes/Notification.routes");
const AvailableMechanicsRoute = require("./Routes/AvailableMechanics.routes");
const MechanicUserRoute = require("./Routes/Mechenic.User.route");
const ServiceRoute = require("./Routes/Service.routes");
const ChatRoute = require("./Routes/chat.routes");
const paymentRoute = require("./Routes/Payment.routes");
const AdminDashboard=require("./Routes/Admin.routes")
app.use("/api/auth", AuthRoute);
app.use("/api/appointement", AppointementRoute);
app.use("/api/feedback", FeedbackRoute);
app.use("/api/dispute", DisputeRoute);
app.use("/api/notification", NotificationRoute);
app.use("/api/availableMechanics", AvailableMechanicsRoute);
app.use("/api/mechanic", MechanicUserRoute);
app.use("/api/service", ServiceRoute);
app.use("/api/chat", ChatRoute);
app.use("/api/payment", paymentRoute);
app.use("/api/admin",AdminDashboard)
// === Root Route ===
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// === Start Server ===
let server = null;

if (process.env.NODE_ENV !== "test") {
const PORT = process.env.PORT || 5000;
server = app.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
});

// === Init Socket.io ===
initSocket(server);
}

module.exports = { app, server };