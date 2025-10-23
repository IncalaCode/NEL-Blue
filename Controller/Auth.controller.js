const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../Models/User.model");
const UserDTO = require("../dto/UserDTO");
const redis = require("../Middleware/Redis");
const transporter = require("../config/nodemailer");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Payment = require("../Models/Payment.model");
const bcrypt=require("bcrypt");
const Service=require("../Models/Service.model")
// ========================
// TOKEN HELPERS
// ========================
const generateToken = async (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.accessTokenSecret, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.refreshTokenSecret, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};

// (Kept for compatibility, but for mobile apps you typically won't use cookies)
const storeCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

// ========================
// INITIATE SIGNUP
// ========================
const initiateSignup = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    country,
    email,
    password,
    phoneNumber,
    role,
    address,
    state,
    zipCode,
    city,
    yearsOfExperience,
    hourlyRate,
    services,
    bio,
    skills,
  } = req.body;

  let uploadedFiles = [];

  // Ensure role is normalized
 
  // 📌 Certificate upload required only for professionals
  if (role === "Professional") {
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Certificates are required for professional users" });
    }
    uploadedFiles = req.files.map((file) => file.path.replace(/\\/g, "/"));
  }

  // 📌 Check if user already exists
  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(400).json({ message: "User already exists" });
  }

  // ✅ Only now generate OTP
  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  await transporter.sendMail({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Your Verification Code",
    text: `Your verification code is: ${verificationCode}`,
  });

  // Save signup data temporarily in Redis
  await redis.set(
    `signup_data:${email}`,
    JSON.stringify({
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      role,
      address,
      country,
      state,
      zipCode,
      city,
      yearsOfExperience,
      hourlyRate,
      services,
      bio,
      skills,
      certificates: uploadedFiles,
      verificationCode,
    }),
    "EX",
    15 * 60
  );

  res.status(200).json({ message: "Verification code sent successfully" });
});


const adminIntiateSignup = asyncHandler(async (req, res) => {
try {
    const { firstName, lastName, email, password, country } = req.body;

  const userExist = await User.findOne({ email });
  if (userExist) {
    return res.status(400).json({ success: false, message: "User already exists" });
  }

  const verificationCode = Math.floor(100000 + Math.random() * 900000);

  await transporter.sendMail({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Your Verification Code",
    text: `Your verification code is: ${verificationCode}`,
  });

  // Save signup data temporarily in Redis
  await redis.set(
    `admin_signup_data:${email}`,
    JSON.stringify({ firstName, lastName, email, password, country, verificationCode }),
    "EX",
    15 * 60 // 15 minutes
  );

  res.status(200).json({ success: true, message: "Verification code sent successfully" });
} catch (error) {
  console.log("AdminInitiateSignup Error:", error);
  res.status(500).json({ success: false, message: "Something went wrong", error: error.message });
}
});


const adminVerifySignup = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  try {
    const storedData = await redis.get(`admin_signup_data:${email}`);
    if (!storedData) {
      return res.status(400).json({ success: false, message: "Signup session expired or invalid" });
    }

    const userData = JSON.parse(storedData);

    // Check OTP
    if (String(userData.verificationCode) !== String(otp)) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // Assign role explicitly
    userData.role = "SuperAdmin";

    // Check again if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Create user (password will be hashed automatically by pre-save hook)
    user = new User(userData);
    await user.save();

    // Delete temporary signup data
    await redis.del(`admin_signup_data:${email}`);

    res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      user,
    });
  } catch (error) {
    console.error("VerifySignup Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});

const adminResendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    // Check if signup session exists
    const storedData = await redis.get(`admin_signup_data:${email}`);
    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: "Signup session expired or invalid. Please initiate signup again.",
      });
    }

    const userData = JSON.parse(storedData);

    // Generate new OTP
    const newVerificationCode = Math.floor(100000 + Math.random() * 900000);

    // Update Redis with new OTP but keep other data intact
    userData.verificationCode = newVerificationCode;

    await redis.set(
      `admin_signup_data:${email}`,
      JSON.stringify(userData),
      "EX",
      15 * 60 // Reset expiration to 15 minutes
    );

    // Send new OTP
    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_FROM,
      subject: "Your New Verification Code",
      text: `Your new verification code is: ${newVerificationCode}`,
    });

    res.status(200).json({
      success: true,
      message: "New verification code sent successfully",
    });
  } catch (error) {
    console.error("ResendOtp Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});




// ========================
// VERIFY OTP + CREATE USER (+ Stripe KYC if needed)
// ========================
const verifySignup = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  try {
    const storedData = await redis.get(`signup_data:${email}`);
    if (!storedData) {
      return res
        .status(400)
        .json({ success: false, message: "Signup session expired or invalid" });
    }

    const userData = JSON.parse(storedData);

    // Check OTP
    if (userData.verificationCode !== parseInt(otp, 10)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid verification code" });
    }

    // Check if user already exists
    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password, // hashed in pre-save hook
        phone: userData.phoneNumber,
        role: userData.role,
        address: userData.address,
        state: userData.state,
        zipCode: userData.zipCode,
        city: userData.city,
        country: userData.country,

        // ✅ Certificates saved properly
        certificates: userData.certificates ,

        // ✅ Professional-specific fields (consistent role check)
        yearsOfExperience:
          userData.role === "Professional" ? userData.yearsOfExperience : null,
        hourlyRate:
          userData.role === "Professional" ? userData.hourlyRate : null,
        bio: userData.role === "Professional" ? userData.bio || "" : "",
        skills: userData.role === "Professional" ? userData.skills || [] : [],
        services:
          userData.role === "Professional" ? userData.services || [] : [],
      });

      await user.save();
    }

    // Clear redis cache
    await redis.del(`signup_data:${email}`);

    // Generate tokens
    const { accessToken, refreshToken } = await generateToken(user._id);
    storeCookies(res, accessToken, refreshToken);
    await storeRefreshToken(user._id, refreshToken);

    return res.status(200).json({
      success: true,
      message: "OTP verified. User registered successfully.",
      data: {
        ...UserDTO.toResponse(user),
        accessToken,
        refreshToken,
        message: "User logged in successfully",
      },
    });
  } catch (error) {
    console.error("VerifySignup Error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
});


const handleWebhook = asyncHandler(async (req, res) => {
  let event;
  console.log("🔥 Webhook received at:", new Date().toISOString());

  try {
    // Parse the raw body
    const rawBody = req.body.toString();
    console.log(
      "Webhook type from headers:",
      req.headers["stripe-signature"] ? "Signed" : "Unsigned"
    );

    // Parse JSON
    event = JSON.parse(rawBody);
    console.log("Webhook event type:", event.type);
    console.log("Event ID:", event.id);
  } catch (err) {
    console.error("❌ Webhook parsing error:", err.message);
    return res.status(400).json({
      success: false,
      message: `Webhook parsing error: ${err.message}`,
    });
  }

  try {
    // Handle verification session events
    if (event.type.includes("identity.verification_session")) {
      const session = event.data.object;
      const email = session?.metadata?.email;

      console.log("Verification session:", {
        type: event.type,
        sessionId: session.id,
        status: session.status,
        email: email,
      });

      if (!email) {
        console.warn("⚠️ No email in verification session metadata");
        return res.status(400).json({
          success: false,
          message: "No email in verification session metadata",
        });
      }

      const user = await User.findOne({ email });
      if (!user) {
        console.warn("⚠️ No user found for email:", email);
        return res.status(404).json({
          success: false,
          message: `No user found for email: ${email}`,
        });
      }

      // Prepare update object
      const update = {
        stripeVerificationSessionId: session.id,
        lastWebhookUpdate: new Date(),
      };

      // Handle different verification statuses
      if (user.role === "Client") {
        update.isClientIdentitySubmited = true;

        if (event.type === "identity.verification_session.verified") {
          update.isClientIdentityVerified = true;
          console.log(`✅ Client identity verified for ${email}`);
        } else if (
          event.type === "identity.verification_session.requires_input" ||
          event.type === "identity.verification_session.canceled"
        ) {
          update.isClientIdentityVerified = false;
          console.log(`❌ Client verification failed for ${email}`);
        }
      }

      if (user.role === "Professional") {
        update.isProfessionalKycSubmited = true;

        if (event.type === "identity.verification_session.verified") {
          update.isProfessionalKycVerified = true;
          console.log(`✅ Professional KYC verified for ${email}`);
        } else if (
          event.type === "identity.verification_session.requires_input" ||
          event.type === "identity.verification_session.canceled"
        ) {
          update.isProfessionalKycVerified = false;
          console.log(`❌ Professional KYC failed for ${email}`);
        }
      }

      // Update user in database
      await User.findByIdAndUpdate(user._id, update);
      console.log(`✅ Updated verification status for ${user.email}`);
    } else if (event.type === "payment_intent.succeeded") {
      const payment = event.data.object;
      console.log(
        `💰 Payment succeeded: ${payment.id}, Amount: ${payment.amount}`
      );
    } else if (event.type === "payment_intent.payment_failed") {
      const payment = event.data.object;
      console.log(
        `❌ Payment failed: ${payment.id}, Reason: ${payment.last_payment_error?.message}`
      );
    } else {
      console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("❌ Error handling webhook:", err);
    res.status(500).json({
      success: false,
      message: err.message || "Webhook processing failed",
    });
  }
});


const verifyAccount = asyncHandler(async (req, res) => {
  console.log("verifying account", req.body)
  const { email } = req.body;
  console.log("email", email)
  // Ensure user exists (should already be created from signup)
  try {
    const user = await User.findOne({ email });
    // Create Stripe Identity Verification Session
    const verificationSession =
      await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: { email: email, source: "mobile_app" },
        options: {
          document: {
            allowed_types: ["driving_license", "id_card", "passport"],
            require_id_number: true,
            require_live_capture: true,
          },
        },
        return_url: "https://nelblue.onrender.com/api/auth/stripe-verify",
      });

    res.status(200).json({
      success: true,
      message: "Proceed with Stripe verification in-app.",
      verificationSessionId: verificationSession.id,
      clientSecret: verificationSession.client_secret,
      verificationUrl: verificationSession.url,
    });
  } catch (error) {
    console.error("VerifyAccount Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
});


// Signup
const signup = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    address,
    state,
    zipCode,
    phoneNumber,
    role,
  } = req.body;
  try {
    const userExist = await User.findOne({ email });
    if (userExist) {
      return res.status(400).json({ message: "User already exists" });
    }
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      address,
      state,
      zipCode,
      phone: phoneNumber,
      role,
    });
    const { accessToken, refreshToken } = await generateToken(user._id);
    storeCookies(res, accessToken, refreshToken);
    await storeRefreshToken(user._id, refreshToken);
    res.status(201).json({
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      role: user.role,
      message: "User created successfully",
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Something went wrong", error });
  }
});
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  try {
    // Check whether OTP is already sent
    const storedCode = await redis.get(`verification_code:${email}`);
    if (storedCode) {
      return res.status(400).json({ success: false, message: "OTP already sent" });
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Send the verification code to the user's email
    const mailOptions = {
      to: email,
      from: "Worku Furniture",
      subject: "Verification Code",
      text: `Your verification code is: ${verificationCode}`,
    };
    await transporter.sendMail(mailOptions);

    // Save the verification code in Redis
    await redis.set(
      `verification_code:${email}`,
      verificationCode,
      "EX",
      5 * 60
    );

    res.status(200).json({
      success: true,
      message: "Verification code sent successfully",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
});

// Login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    // ✅ Check user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // ✅ Allow only client & professional
    if (!["Client", "Professional"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. This login is only for clients and professionals.",
      });
    }

    // ❌ Block suspended accounts
    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Contact the admin.",
      });
    }

    // ✅ Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    // ✅ Handle Two-Factor Authentication
    if (user.twoFactorEnabled) {
      const verificationCode = Math.floor(100000 + Math.random() * 900000);

      const mailOptions = {
        to: email,
        from: process.env.MAIL_FROM || "no-reply@example.com",
        subject: "Two-Factor Authentication Code",
        text: `Your verification code is: ${verificationCode}`,
      };

      await transporter.sendMail(mailOptions);

      // store OTP in Redis with 5 min expiry
      await redis.set(
        `two_factor_otp:${email}`,
        verificationCode,
        "EX",
        5 * 60
      );

      return res.status(200).json({
        success: true,
        twoFactorEnabled: true,
        userId: user._id,
        email: user.email,
        message: "2FA OTP sent to your email",
      });
    }

    // ✅ Normal login (no 2FA)
    const { accessToken, refreshToken } = await generateToken(user._id);

    await storeRefreshToken(user._id.toString(), refreshToken);
    storeCookies(res, accessToken, refreshToken);

    // Populate services to match Dart ServiceCategory model
    await user.populate('services');
    
    return res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user: UserDTO.toResponse(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
});



// Logout
const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    if (refreshToken) {
      const decode = jwt.verify(refreshToken, process.env.refreshTokenSecret);
      await redis.del(`refresh_token:${decode.userId}`);
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    res.status(200).json({ success: true, message: "Logout successful" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
});


// Refresh Token
const refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  try {
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "No token found" });
    }
    const decoded = jwt.verify(refreshToken, process.env.refreshTokenSecret);
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
    if (refreshToken !== storedToken) {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }
    const { accessToken } = await generateToken(decoded.userId);
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });
    res.status(200).json({ success: true, message: "Access token refreshed" });
  } catch (error) {
    console.error("Refresh Token Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Get Profile
const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("services");
    res.status(200).json({ success: true, user: UserDTO.toResponse(user) });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Get All Users (Admin Only)
const getAllUser = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({}).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Update Password
const updatePassword = asyncHandler(async (req, res) => {
  const { email } = req.user;
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    user.password = newPassword; // ✅ Correct field name
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Update Password Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});


// Reset Password
// Reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Update Profile
const updateProfile = asyncHandler(async (req, res) => {
  const { email } = req.user;
  const { address, phone } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.address = address;
    user.phone = phone;
    await user.save();
    res.status(200).json({ success: true, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Delete User
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Update User Role
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.role = role;
    await user.save();
    res.status(200).json({ success: true, message: "User role updated successfully" });
  } catch (error) {
    console.error("Update User Role Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

// Get All Users
const getAllUsers = asyncHandler(async (req, res) => {
  try {
    const users = await User.find({}).select(
      "-password -resetPasswordToken -resetPasswordExpires"
    );
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});


const requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Generate a 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Send the verification code to the user's email
    const mailOptions = {
      to: email,
      from: "your-email@example.com",
      subject: "Password Reset OTP",
      text: `Your password reset OTP is: ${verificationCode}`,
    };

    await transporter.sendMail(mailOptions);

    // Save the verification code in redis with expiration (5 minutes)
    await redis.set(`password_reset:${email}`, verificationCode, "EX", 5 * 60);

    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      email,
      purpose: "password_reset",
    });
  } catch (error) {
    console.error("Password Reset Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

const verifyPasswordResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  try {
    const storedCode = await redis.get(`password_reset:${email}`);

    if (!storedCode || storedCode !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // Delete the OTP from redis after successful verification
    await redis.del(`password_reset:${email}`);

    res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      email,
      otp,
    });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

const completePasswordReset = asyncHandler(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    // Verify the OTP again (in case the user took too long)
    const storedCode = await redis.get(`password_reset:${email}`);
    if (storedCode && storedCode !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Update the password
    user.password = newPassword;
    await user.save();

    // Clear any existing OTP
    await redis.del(`password_reset:${email}`);

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Password Reset Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});
const EnableTwoFactorAuthentication = asyncHandler(async (req, res) => {
  const { enable } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.twoFactorEnabled = enable;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Two-factor authentication updated successfully",
      enable,
    });
  } catch (error) {
    console.error("Enable Two-factor Authentication Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});
const verifyTwoFactorAuth = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Verify the OTP
    const storedCode = await redis.get(`two_factor_otp:${email}`);
    if (!storedCode || storedCode !== otp.toString()) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    // OTP is valid, proceed with login
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { accessToken, refreshToken } = await generateToken(user._id);
    storeCookies(res, accessToken, refreshToken);
    await storeRefreshToken(user._id, refreshToken);

    // Clear the OTP from redis
    await redis.del(`two_factor_otp:${email}`);

    // Populate services for consistency
    await user.populate('services');
    
    res.status(200).json({
      success: true,
      ...UserDTO.toResponse(user),
      accessToken,
      refreshToken,
      message: "Two-factor authentication successful",
    });
  } catch (error) {
    console.error("2FA Verification Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});


const approveUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.identityVerified = true;
    await user.save();
    res.status(200).json({ success: true, message: "User approved successfully" });
  } catch (error) {
    console.error("Approve User Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

const RejectUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    user.identityVerified = false;
    await user.save();
    res.status(200).json({ success: true, message: "User rejected successfully" });
  } catch (error) {
    console.error("Reject User Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});
const uploadCertificate = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No files uploaded" });
    }

    const uploadedFiles = req.files.map((file) => file.path.replace(/\\/g, "/"));
    user.certificates.push(...uploadedFiles);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Certificates uploaded successfully",
      certificates: user.certificates,
    });
  } catch (error) {
    console.error("Upload Certificate Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});

const deleteMyAccount = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ success: false, message: error.message || "Something went wrong" });
  }
});
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // ✅ Validate input
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Please provide email and password" });
  }

  // ✅ Find admin/super admin
  const adminUser = await User.findOne({ email, role: { $in: ["Admin", "SuperAdmin"] } });
  if (!adminUser) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  // ✅ Validate password
  const isPasswordMatch = await bcrypt.compare(password, adminUser.password);
  if (!isPasswordMatch) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  // ✅ Generate tokens
  const { accessToken, refreshToken } = await generateToken(adminUser._id);

  // ✅ Store refresh token in Redis
  await storeRefreshToken(adminUser._id.toString(), refreshToken);

  // ✅ Store tokens in cookies (optional for web)
  storeCookies(res, accessToken, refreshToken);

  // ✅ Response
  res.status(200).json({
    success: true,
    message: "Login successful",
    user: {
      id: adminUser._id,
      email: adminUser.email,
      role: adminUser.role,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    },
    accessToken,
    refreshToken,
  });
});
const switchRole = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  if (user.role === "SuperAdmin") {
    return res.status(403).json({ success: false, message: "SuperAdmin role cannot be changed" });
  }

  if (user.role === "Client") {
    // Client → Professional: check services
    if (!user.services || user.services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Service is null",
      });
    }
    user.role = "Professional";
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Role changed to Professional. Please complete KYC.",
      data: { role: user.role },
    });
  }

  if (user.role === "Professional") {
    // Professional → Client
    user.role = "Client";
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Role changed to Client.",
      data: { role: user.role },
    });
  }
  } catch (error) {
    console.error("Switch Role Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});
const updateProfessionalKyc = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    
    // ✅ Require at least one service ID from frontend
    if (!req.body.services || req.body.services.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one service is required to submit Professional KYC",
      });
    }

    // Normalize (accept single or array of IDs)
    const serviceIds = [].concat(req.body.services);

    // ✅ Validate service IDs actually exist in DB
    const validServices = await Service.find({ _id: { $in: serviceIds } });

    if (validServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service IDs provided",
      });
    }

    // Attach services to professional
    user.services = validServices.map((s) => s._id);

    // Optional fields
    user.bio = req.body.bio || user.bio;
    user.skills = req.body.skills ? [].concat(req.body.skills) : user.skills;
    user.yearsOfExperience = req.body.yearsOfExperience || user.yearsOfExperience;
    user.hourlyRate = req.body.hourlyRate || user.hourlyRate;
    user.specialization = req.body.specialization
      ? [].concat(req.body.specialization)
      : user.specialization;

    // Handle certificate uploads
    if (req.files && req.files.length > 0) {
      const uploadedCertificates = req.files.map((file) =>
        file.path.replace(/\\/g, "/")
      );
      if (!user.certificates) user.certificates = [];
      user.certificates.push(...uploadedCertificates);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Professional KYC updated successfully",
      data: {
        bio: user.bio,
        skills: user.skills,
        yearsOfExperience: user.yearsOfExperience,
        hourlyRate: user.hourlyRate,
        specialization: user.specialization,
        certificates: user.certificates,
        services: user.services,
        isProfessionalKycSubmited: user.isProfessionalKycSubmited,
        isProfessionalKycVerified: user.isProfessionalKycVerified,
      },
    });
  } catch (error) {
    console.error("Update Professional KYC Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

const checkVerification = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ verified: user.identityVerified });
  } catch (error) {
    console.error("Check Verification Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

const toggleAvailability = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('services');
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    if (user.role !== "Professional") {
      return res.status(400).json({ 
        success: false, 
        message: "Only professionals can update availability" 
      });
    }
    
    // Toggle availability
    user.availabilty = user.availabilty === "Available" ? "Unavailable" : "Available";
    await user.save();
    
    res.status(200).json({
      success: true,
      message: `Availability switched to ${user.availabilty}`,
      user: UserDTO.toAvailabilityResponse(user)
    });
  } catch (error) {
    console.error("Toggle Availability Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});



module.exports = {
  switchRole,
  updateProfessionalKyc,
  checkVerification,
  toggleAvailability,
  adminLogin,
  deleteMyAccount,
  adminIntiateSignup,
  adminVerifySignup,
  requestPasswordReset,
  verifyPasswordResetOtp,
  verifyTwoFactorAuth,
  completePasswordReset,
  signup,
  login,
  uploadCertificate,
  logout,
  updateProfile,
  refreshToken,
  verifyAccount,
  getProfile,
  getAllUser,
  resetPassword,
  updatePassword,
  initiateSignup,
  EnableTwoFactorAuthentication,
  verifySignup,
  RejectUser,
  approveUser,
  resendOtp,
  deleteUser,
  updateUserRole,
  getAllUsers,
  handleWebhook,
  adminResendOtp
};
