// seed.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Import models
const User = require("./Models/User.model");
const Service = require("./Models/Service.model");
const Appointment = require("./Models/Appointement.model");
const Availability = require("./Models/Availabilty.model");
const { Chat, Message } = require("./Models/Chat.model");
const Dispute = require("./Models/Dispute.model");
const FeedBack = require("./Models/FeedBack.model");
const Notification = require("./Models/Notification.model");
const Payment = require("./Models/Payment.model");

const MONGO_URI = "mongodb+srv://admin:admin@backend.tiwmvrb.mongodb.net/?retryWrites=true&w=majority&appName=Backend"; // change if needed

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      User.deleteMany(),
      Service.deleteMany(),
      Appointment.deleteMany(),
      Availability.deleteMany(),
      Chat.deleteMany(),
      Message.deleteMany(),
      Dispute.deleteMany(),
      FeedBack.deleteMany(),
      Notification.deleteMany(),
      Payment.deleteMany(),
    ]);

    // Seed Users
    const hashedPassword = await bcrypt.hash("password123", 10);
    const client = await User.create({
      firstName: "John",
      lastName: "Doe",
      email: "johndoe@gmail.com",
      password: hashedPassword,
      role: "Client",
      city: "New York",
      state: "NY",
    });

    const mechanic = await User.create({
      firstName: "Jane",
      lastName: "Smith",
      email: "janesmith@gmail.com",
      password: hashedPassword,
      role: "Professional",
      city: "Los Angeles",
      state: "CA",
    });

    const admin = await User.create({
      firstName: "Admin",
      lastName: "Super",
      email: "superadmin@gmail.com",
      password: hashedPassword,
      role: "SuperAdmin",
    });

    console.log("👤 Users seeded");

    // Availability
    const availability = await Availability.create({
      day: "Monday",
      startTime: "09:00",
      endTime: "17:00",
      status: "Available",
    });

    mechanic.availabilty = availability._id;
    await mechanic.save();

    console.log("📅 Availability seeded");

    // Services
    const service1 = await Service.create({
      serviceName: "Oil Change",
      price: { min: 50, max: 100 },
      professionalId: mechanic._id,
      category: "Maintenance",
      serviceCode: 101,
    });

    const service2 = await Service.create({
      serviceName: "Brake Repair",
      price: { min: 150, max: 300 },
      professionalId: mechanic._id,
      category: "Repair",
      serviceCode: 102,
    });

    console.log("🛠️ Services seeded");

    // Appointment
    const appointment = await Appointment.create({
      userId: client._id,
      serviceId: [service1._id],
      categories: "Maintenance",
      vehicleType: "Car",
      appointmentDate: new Date(),
      appointmentTime: "10:00 AM",
      issue: "Engine oil leakage",
      budget: 80,
      status: "Pending",
    });

    console.log("📆 Appointment seeded");

    // Chat + Message
    const message = await Message.create({
      sender: client._id,
      content: "Hi, I need help with my car.",
      messageType: "text",
    });

    const chat = await Chat.create({
      appointment: appointment._id,
      client: client._id,
      mechanic: mechanic._id,
      messages: [message],
      lastMessage: message._id,
    });

    console.log("💬 Chat + Message seeded");

    // Payment
    const payment = await Payment.create({
      client: client._id,
      mechanic: mechanic._id,
      appointment: appointment._id,
      amount: 100,
      platformFee: 10,
      mechanicEarnings: 90,
      currency: "USD",
      paymentIntentId: "pi_123456",
      status: "paid",
      paymentMethod: "card",
      transactionId: "txn_123456",
    });

    console.log("💳 Payment seeded");

    // Notification
    await Notification.create({
      userId: mechanic._id,
      catagories: "Repair",
      vehicleType: "Car",
      appointmentDate: new Date(),
      appointmentTime: "11:00 AM",
      issue: "Brake noise",
      paymentStatus: "Pending",
    });

    console.log("🔔 Notification seeded");

    // Feedback
    await FeedBack.create({
      userId: client._id,
      rating: 5,
      feedback: "Excellent service!",
    });

    console.log("⭐ Feedback seeded");

    // Dispute
    await Dispute.create({
      raisedBy: client._id,
      message: "Mechanic did not show up",
      images: [],
      status: "pending",
    });

    console.log("⚖️ Dispute seeded");

    console.log("✅ All data seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
}

seed();
