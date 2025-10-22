const express = require("express");
const router = express.Router();
const User = require("../Models/User.model");
const jwt = require("jsonwebtoken");
const dotenv=require("dotenv");
dotenv.config();
const protectRoute = async (req, res, next) => {
  try {
    let accessToken = req.cookies?.accessToken;

    // fallback: check Authorization header
    if (!accessToken && req.headers.authorization) {
      accessToken = req.headers.authorization.split(" ")[1]; // Bearer <token>
    }

    if (!accessToken) {
      return res.status(401).json({ message: "Unauthorized - No access token provided" });
    }

    // ✅ Use the secret from environment
    const decoded = jwt.verify(accessToken, process.env.accessTokenSecret);

    const user = await User.findById(decoded.userId).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Access token expired" });
    }
    console.error("Error in protectRoute middleware:", error.message);
    return res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};


const ProfessionalRoute = (req, res, next) => {

  // Check if the user is authenticated and has the role of Admin 
  if (req.user && req.user.role === "Professional") {
    next();
  } else {
    res.status(501).json({
      message: "unauthorized user,admin only",
    });
  }
};

const superAdminRoute = (req, res, next) => {
  if (req.user && req.user.role === "SuperAdmin") {
    next();
  } else {
    res.status(501).json({
      message: "unauthorized user,super admin only",
    });
  }
};
const adminRoute = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    res.status(501).json({
      message: "unauthorized user,super admin only",
    });
  }
};


module.exports = { protectRoute,adminRoute, ProfessionalRoute,superAdminRoute };