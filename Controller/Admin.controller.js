const Payment = require("../Models/Payment.model");
const User = require("../Models/User.model");
const asyncHandler = require("express-async-handler");
const Feedback=require("../Models/FeedBack.model")
const Availability=require("../Models/Availabilty.model")
const AppointmentModel=require("../Models/Appointement.model")
const analayticsDashboard = asyncHandler(async (req, res) => {
  try {
    // =============================
    // ✅ REVENUE (Deposit & Withdrawal)
    // =============================
    const [depositAgg, withdrawalAgg] = await Promise.all([
      Payment.aggregate([
        { $match: { type: "Deposit", paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      Payment.aggregate([
        { $match: { type: "Withdrawal", paymentStatus: "Paid" } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);

    const revenue = {
      deposits: depositAgg.length > 0 ? depositAgg[0].total : 0,
      withdrawals: withdrawalAgg.length > 0 ? withdrawalAgg[0].total : 0,
      net: (depositAgg.length > 0 ? depositAgg[0].total : 0) -
           (withdrawalAgg.length > 0 ? withdrawalAgg[0].total : 0),
    };

    // =============================
    // ✅ TASK PROGRESS (Day / Week / Month)
    // =============================
    const taskDaily = await Payment.aggregate([
      { $unwind: "$services" },
      {
        $group: {
          _id: { $dayOfWeek: "$createdAt" }, // 1=Sunday, 7=Saturday
          totalTasks: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const taskWeekly = await Payment.aggregate([
      { $unwind: "$services" },
      {
        $group: {
          _id: { $week: "$createdAt" },
          totalTasks: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    const taskMonthly = await Payment.aggregate([
      { $unwind: "$services" },
      {
        $group: {
          _id: { $month: "$createdAt" },
          totalTasks: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // =============================
    // ✅ CLIENT VS PROFESSIONAL REGISTRATIONS (Day of week)
    // =============================
    const clientVsProfessional = await User.aggregate([
      {
        $group: {
          _id: { role: "$role", day: { $dayOfWeek: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.day",
          roles: {
            $push: { role: "$_id.role", count: "$count" },
          },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // Map days (Mongo: 1=Sunday, 7=Saturday)
    const dayMap = {
      1: "Sunday",
      2: "Monday",
      3: "Tuesday",
      4: "Wednesday",
      5: "Thursday",
      6: "Friday",
      7: "Saturday",
    };

    const clientProfessionalBar = clientVsProfessional.map((item) => {
      const entry = { day: dayMap[item._id], Client: 0, Professional: 0 };
      item.roles.forEach((r) => {
        if (r.role === "Client") entry.Client = r.count;
        if (r.role === "Professional") entry.Professional = r.count;
      });
      return entry;
    });

    // =============================
    // ✅ SEND RESPONSE
    // =============================
    res.status(200).json({
      revenue,
      tasks: {
        daily: taskDaily.map((t) => ({ day: dayMap[t._id], total: t.totalTasks })),
        weekly: taskWeekly.map((t) => ({ week: t._id, total: t.totalTasks })),
        monthly: taskMonthly.map((t) => ({ month: t._id, total: t.totalTasks })),
      },
      clientProfessional: clientProfessionalBar,
    });
  } catch (error) {
    console.error("Analytics Dashboard Error:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
});
const ProjectDashBoard = asyncHandler(async (req, res) => {
  const userId = req.user._id; // comes from protectRoute middleware

  // Fetch user with availability
  const user = await User.findById(userId).populate("availabilty");

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  // Fetch appointments/projects related to this user
  const appointments = await AppointmentModel.find({ userId })
    .populate("userId", "firstName lastName email role profileImage")
    .populate("serviceId", "title description price");

  // Fetch feedbacks
  const feedbacks = await Feedback.find({ userId }).populate(
    "userId",
    "firstName lastName email profileImage"
  );

  // Fetch payments
  const payments = await Payment.find({ userId });

  // Average rating from feedbacks
  let avgRating = 0;
  if (feedbacks.length > 0) {
    avgRating =
      feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length;
  }

  res.status(200).json({
    success: true,
    user,
    projects: appointments, // ✅ project/appointment details
    payments,
    feedbacks,
    stats: {
      totalProjects: appointments.length,
      totalPayments: payments.length,
      totalFeedbacks: feedbacks.length,
      avgRating: avgRating.toFixed(1),
    },
  });
});
const userDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id; // assuming protectRoute middleware sets req.user

  // Fetch user with availability populated
  const user = await User.findById(userId).populate("availabilty");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  // Fetch payments
  const payments = await Payment.find({ userId });

  // Fetch feedbacks
  const feedbacks = await Feedback.find({ userId }).populate(
    "userId",
    "firstName lastName email role profileImage"
  );

  // Average rating
  let avgRating = 0;
  if (feedbacks.length > 0) {
    avgRating =
      feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length;
  }

  res.status(200).json({
    success: true,
    user, // ✅ includes availability now
    payments,
    feedbacks,
    stats: {
      totalPayments: payments.length,
      totalFeedbacks: feedbacks.length,
      avgRating: avgRating.toFixed(1),
    },
  });
});

const adminDashboard = asyncHandler(async (req, res) => {
  try {
    // ✅ Total Revenue (Paid only)
    const revenueData = await Payment.aggregate([
      { $match: { status: "paid" } }, // ✅ matches your schema's status values
      { $group: { _id: null, totalRevenue: { $sum: "$amount" } } }, // ✅ use amount
    ]);
    const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // ✅ Status counts
    const [ongoingPayments, completedPayments, canceledPayments] = await Promise.all([
      Payment.countDocuments({ status: "pending_payment" }), // adjust to your enum
      Payment.countDocuments({ status: "released" }),        // funds released = completed
      Payment.countDocuments({ status: "cancelled" }),       // cancelled
    ]);

    // ✅ New Users (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const newUsers = await User.countDocuments({ createdAt: { $gte: last7Days } });

    // ✅ Task Progress (payments per day)
    const taskProgress = await Payment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalPayments: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // ✅ Recent Payments (latest 10) with both client & mechanic
    const recentPayments = await Payment.find()
      .populate("client", "firstName lastName email")
      .populate("mechanic", "firstName lastName email")
      .populate("appointment")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      revenue,
      ongoingPayments,
      completedPayments,
      canceledPayments,
      newUsers,
      taskProgress,
      recentPayments,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
});


const getAllProjects = asyncHandler(async (req, res) => {
  try {
    // Fetch all projects/appointments with populated user & service details
    const projects = await AppointmentModel.find()
      .populate("userId", "firstName lastName email role profileImage")
      .populate("serviceId", "title description price")
      .sort({ createdAt: -1 });

    // Fetch all payments related to these projects
    const projectIds = projects.map(p => p._id);
    const payments = await Payment.find({ appointmentId: { $in: projectIds } });

    // Fetch all feedbacks for these projects
    const feedbacks = await Feedback.find({ appointmentId: { $in: projectIds } })
      .populate("userId", "firstName lastName email profileImage");

    // Calculate overall stats
    const totalProjects = projects.length;
    const totalPayments = payments.length;
    const totalFeedbacks = feedbacks.length;

    let avgRating = 0;
    if (feedbacks.length > 0) {
      avgRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0) / feedbacks.length;
    }

    res.status(200).json({
      success: true,
      projects,
      payments,
      feedbacks,
      stats: {
        totalProjects,
        totalPayments,
        totalFeedbacks,
        avgRating: avgRating.toFixed(1),
      },
    });
  } catch (error) {
    console.error("Get All Projects Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});





module.exports = { getAllProjects, adminDashboard,userDashboard,ProjectDashBoard,analayticsDashboard };
