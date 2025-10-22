const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "doubleasam92@gmail.com", // Gmail account
    pass: "qtlfpquviowqnawr", // App password without spaces
  },
});

module.exports = transporter;
