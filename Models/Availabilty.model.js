const mongoose = require("mongoose");


const availabilitySchema = new mongoose.Schema({
  day: {
    type: String,
    enum: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    required: true,
  },
  startTime: {
    type: String, // HH:mm format (24-hour)
    required: true,
  },
  endTime: {
    type: String, // HH:mm format (24-hour)
    required: true,
  },
  status: {
    type: String,
    enum: ["Available", "Unavailable"],
    default: "Available",
  },
});

module.exports = mongoose.model("Availability", availabilitySchema);