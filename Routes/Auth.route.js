const express = require("express");
const router = express.Router();
const {
  protectRoute,
  ProfessionalRoute,
  superAdminRoute,
} = require("../Middleware/Protect.route");
const {
  deleteMyAccount,
  signup,
  updateProfessionalKyc,
  handleWebhook,
  uploadCertificate,
  login,
  initiateSignup,
  requestPasswordReset,
  verifyPasswordResetOtp,
  completePasswordReset,
  verifySignup,
  verifyAccount,
  verifyTwoFactorAuth,
  resendOtp,
  logout,
  updateProfile,
  refreshToken,
  getProfile,
  updatePassword,
  getAllUser,
  EnableTwoFactorAuthentication,
  resetPassword,
  approveUser,
  RejectUser,
  deleteUser,
  updateUserRole,
  switchRole
} = require("../Controller/Auth.controller");
const { Verify } = require("crypto");
const passport = require("passport");
const { OAuth2Client } = require("google-auth-library");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("../Models/User.model");
const {
  upload,
  uploadImages,
  uploadPDFs,
  handleFileUploadErrors,
} = require("../config/MulterConfig");
const redis = require("../Middleware/Redis");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
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
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://nelblue.onrender.com/api/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const { givenName: firstName, familyName: lastName } = profile.name;
        const displayName = profile.displayName;

        // Generate a random phone number placeholder
        const randomPhoneSuffix = Math.floor(1000 + Math.random() * 9000);
        const placeholderPhone = `+1000${randomPhoneSuffix}`;

        // Generate a random password that won't be used but satisfies validation
        const placeholderPassword = `google-auth-${Math.random()
          .toString(36)
          .slice(2)}`;

        let user = await User.findOne({
          $or: [{ googleId: profile.id }, { email: email }],
        });

        if (!user) {
          // Create new user with required fields
          user = await User.create({
            googleId: profile.id,
            name: displayName,
            email: email,
            firstName: firstName || "Google",
            lastName: lastName || "User",
            role: "Client",
            isVerified: true,
            phoneNumber: placeholderPhone,
            password: placeholderPassword, // Will be hashed by pre-save hook
            city: "City to be updated",
            state: "State to be updated",
            // Other required fields from your schema
            address: "Address to be updated",
            zipCode: "00000",
            govermentIdFront: "pending",
            govermentIdBack: "pending",
            drivingLicenseBack: "pending",
            drivingLicenseFront: "pending",
            // Default mechanic-specific fields
            yearsOfExperience: 0,
            hourlyRate: 0,
            description: "",
            specialization: [],
          });
        } else if (!user.googleId) {
          // Update existing user with Google ID
          user.googleId = profile.id;
          user.isVerified = true;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error("Google OAuth error:", err);
        return done(err, null);
      }
    }
  )
);



/**
 * @swagger
 * /auth/google/complete-profile:
 *   post:
 *     summary: Complete Google user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     description: Update required profile fields for Google-authenticated users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - address
 *               - city
 *               - state
 *               - zipCode
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid data or profile already complete
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post("/google/complete-profile", protectRoute, async (req, res) => {
  try {
    const userId = req.user.id; // From JWT middleware
    const { phoneNumber, address, city, state, zipCode } = req.body;

    // Validate required fields
    if (!phoneNumber || !address || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if profile already complete
    if (!user.needsProfileCompletion) {
      return res.status(400).json({
        success: false,
        message: "Profile already completed",
      });
    }

    // Update profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        phoneNumber,
        city,
        state,
        zipCode,
        address,
        zipCode,
        needsProfileCompletion: false,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Profile completed successfully",
      user: {
        id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phoneNumber: updatedUser.phoneNumber,
        address: updatedUser.address,
        city: updatedUser.city,
        state: updatedUser.state,
        zipCode: updatedUser.zipCode,
      },
    });
  } catch (error) {
    console.error("Profile completion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete profile",
    });
  }
});
// -------------------- GOOGLE SIGNUP --------------------
/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google Sign-In for Mobile Apps
 *     tags: [Authentication]
 *     description: Authenticate existing users using Google Sign-In token (mobile only).  
 *       If the user does not exist, authentication will fail.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token from mobile SDK
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 needsProfileCompletion:
 *                   type: boolean
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized (invalid token)
 *       404:
 *         description: User does not exist
 *       500:
 *         description: Server error
 */

router.post("/google", async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
      });
    }

    // ✅ Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token",
      });
    }

    // ✅ Find existing user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: payload.email }],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist please signup first",
      });
    }
     if (!["Client", "Professional"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: `Users with role '${user.role}' are not allowed to login via Google`,
      });
    }


    // ✅ Update user with googleId / profile image if missing
    const updates = {};
    if (!user.googleId) updates.googleId = payload.sub;
    if (!user.isVerified) updates.isVerified = true;
    if (!user.profileImage && payload.picture) updates.profileImage = payload.picture;

    if (Object.keys(updates).length > 0) {
      user = await User.findByIdAndUpdate(user._id, updates, { new: true });
    }

    // ✅ Generate access + refresh tokens
    const { accessToken, refreshToken } = await generateToken(user._id);

    // ✅ Store refresh token in Redis
    await storeRefreshToken(user._id, refreshToken);

    // ✅ Store in cookies (for web clients)
    storeCookies(res, accessToken, refreshToken);

    return res.json({
      success: true,
      message: "Google authentication successful",
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImage: user.profileImage,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isClientIdentityVerified: user.isClientIdentityVerified,
        isClientIdentitySubmited: user.isClientIdentitySubmited,
        isProfessionalKycVerified: user.isProfessionalKycVerified,
        isProfessionalKycSubmited: user.isProfessionalKycSubmited,
      },
      needsProfileCompletion: user.needsProfileCompletion,
      accessToken, // mobile/web clients can use this
      refreshToken, // mobile/web clients can use this
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({
      success: false,
      message: "Authentication failed. Please try again.",
    });
  }
});
/**
 * @swagger
 * /auth/signup/initiate:
 *   post:
 *     summary: Initiate user signup and send email verification code
 *     tags: [Authentication]
 *     description: |
 *       This endpoint temporarily stores user registration data and sends a verification code via email.
 *       The data is stored in Redis for 5 minutes and will be used during verification.
 *
 *       🔑 Notes:
 *       - If the role is **Professional**, additional fields such as `yearsOfExperience`, `hourlyRate`, `bio`, `skills`, `services`, 
 *         and **certificates** (file uploads) are required.
 *       - For other roles (**Client, Admin**), Stripe KYC verification will be required after OTP verification.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - phoneNumber
 *               - role
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@gmail.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 example: StrongPass123
 *               phoneNumber:
 *                 type: string
 *                 example: "+1234567890"
 *               role:
 *                 type: string
 *                 enum: [Client, Professional, Admin]
 *                 example: Professional
 *               address:
 *                 type: string
 *                 example: "123 Main St"
 *               state:
 *                 type: string
 *                 example: "CA"
 *               zipCode:
 *                 type: string
 *                 example: "90210"
 *               city:
 *                 type: string
 *                 example: "Los Angeles"
 *               yearsOfExperience:
 *                 type: number
 *                 example: 5
 *                 description: Required only if role = Professional
 *               hourlyRate:
 *                 type: number
 *                 example: 20
 *                 description: Required only if role = Professional
 *               bio:
 *                 type: string
 *                 example: "Experienced auto mechanic specializing in engine repair"
 *                 description: Required only if role = Professional
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Diagnostics", "Brake Repair", "Engine Overhaul"]
 *                 description: Required only if role = Professional
 *               services:
 *                 type: array
 *                 items:
 *                   type: string
 *                   description: ObjectId of a Service
 *                 example: ["64f1b0f9a93b2e7c12345678", "64f1b0f9a93b2e7c98765432"]
 *                 description: Required only if role = Professional (array of Service IDs)
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 certificate files (required if role = Professional)
 *     responses:
 *       200:
 *         description: Verification code sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Verification code sent successfully
 *       400:
 *         description: User already exists or missing required professional details
 *       500:
 *         description: Server error
 */

router.post(
  "/signup/initiate",
  uploadImages.array("certificates", 5),
  handleFileUploadErrors,
  initiateSignup
);


/**
 * @swagger
 * /auth/verify-account:
 *   post:
 *     summary: Verify user account
 *     tags: [Authentication]
 *     description: |
 *       Verifies a user's account after OTP verification or other checks.  
 *       This simply updates the user's verification status in the system.
 *
 *       🔑 Behavior:
 *       - Ensures the user exists.
 *       - Marks the user as verified in the database.
 *     security:
 *       - bearerAuth: []   # Requires JWT token
 *     responses:
 *       200:
 *         description: User account verified successfully
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
 *                   example: Account verified successfully.
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.post("/signup/verify", verifySignup);

/**
 * @swagger
 * /auth/signup/resend-otp:
 *   put:
 *     summary: Resend email verification OTP
 *     tags: [Authentication]
 *     description: This endpoint checks if an OTP was already sent. If not, it generates a new 6-digit verification code, sends it to the provided email, and stores it in Redis with a 5-minute expiration.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: john.doe@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             example:
 *               message: verification code sent successfully
 *       400:
 *         description: OTP already sent
 *         content:
 *           application/json:
 *             example:
 *               message: OTP already sent
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: Something went wrong
 */
router.put("/signup/resend-otp", resendOtp);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User login with email and password
 *     tags: [Authentication]
 *     description: >
 *       Allows a user to log in.
 *       - If Two-Factor Authentication (2FA) is enabled, an OTP will be sent to the user's email for additional verification.
 *       - Otherwise, the user will be logged in directly.
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
 *                 example: john.doe@example.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123
 *     responses:
 *       200:
 *         description: Successful login or 2FA OTP sent
 *         content:
 *           application/json:
 *             oneOf:
 *               - schema:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "64f1c8b4e2d5b3"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     role:
 *                       type: string
 *                       example: "Client"
 *                     accessToken:
 *                       type: string
 *                       example: "jwt-access-token"
 *                     refreshToken:
 *                       type: string
 *                       example: "jwt-refresh-token"
 *                     message:
 *                       type: string
 *                       example: "User logged in successfully"
 *               - schema:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     twoFactorEnabled:
 *                       type: boolean
 *                       example: true
 *                     userId:
 *                       type: string
 *                       example: "64f1c8b4e2d5b3"
 *                     email:
 *                       type: string
 *                       example: "john.doe@example.com"
 *                     message:
 *                       type: string
 *                       example: "2FA OTP sent to your email"
 *       400:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid credentials"
 *       403:
 *         description: Forbidden – account suspended
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Your account has been suspended. Contact the admin."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Something went wrong"
 */

router.post("/login", login);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout the currently logged-in user
 *     tags: [Authentication]
 *     description: Clears access and refresh tokens from cookies and deletes the refresh token from Redis to invalidate the session.
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             example:
 *               message: "Logout successful"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Something went wrong"
 */
router.post("/logout", logout);
/**
 * @swagger
 * /auth/refreshtoken:
 *   post:
 *     summary: Refresh the access token using a valid refresh token
 *     tags: [Authentication]
 *     description: Generates a new access token if the provided refresh token is valid and matches the one stored in Redis.
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             example:
 *               message: "Access token refreshed"
 *       401:
 *         description: Unauthorized or invalid token
 *         content:
 *           application/json:
 *             examples:
 *               NoToken:
 *                 summary: No token found
 *                 value:
 *                   message: "No token found"
 *               InvalidToken:
 *                 summary: Invalid refresh token
 *                 value:
 *                   message: "Invalid refresh token"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Something went wrong"
 */
router.post("/refreshtoken", refreshToken);
/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get the logged-in user's profile
 *     tags: [Authentication]
 *     description: Returns the profile information of the currently authenticated user. Requires a valid access token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               id: "64f1c8b4e2d5b3"
 *               firstName: "John"
 *               lastName: "Doe"
 *               email: "john.doe@example.com"
 *               phoneNumber: "+1234567890"
 *               role: "Client"
 *               totalDonated: 500
 *               donationCount: 3
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             example:
 *               message: "Unauthorized"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             example:
 *               message: "Something went wrong"
 */
router.get("/profile", protectRoute, getProfile);
/**
 * @swagger
 * /auth/getallusers:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get("/getallusers", protectRoute, superAdminRoute, getAllUser);
/**
 * @swagger
 * /auth/updateprofile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put("/updateprofile", protectRoute, updateProfile);
// In your Auth.routes.js
/**
 * @swagger
 * /auth/password/reset/request:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */

router.post("/password/reset/request", requestPasswordReset);
/**
 * @swagger
 * /auth/password/reset/verify:
 *   post:
 *     summary: Verify password reset OTP
 *     tags: [Password]
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */

router.post("/password/reset/verify", verifyPasswordResetOtp);
/**
 * @swagger
 * /auth/password/reset/complete:
 *   post:
 *     summary: Complete password reset with OTP
 *     tags: [Password]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: StrongPass123!
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired OTP
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post("/password/reset/complete", completePasswordReset);

/**
 * @swagger
 * /auth/password/update:
 *   put:
 *     summary: Update password for logged-in user
 *     tags: [Password]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *                 example: OldPass123!
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: NewStrongPass456!
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Invalid credentials
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put("/password/update", protectRoute, updatePassword);

//update user role
/**
 * @swagger
 * /auth/deleteuser/{id}:
 *   delete:
 *     summary: Delete a user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted successfully
 */
router.delete("/deleteuser/:id", protectRoute, superAdminRoute, deleteUser);
/**
 * @swagger
 * /auth/updateuserrole/{id}:
 *   put:
 *     summary: Update user role (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User role updated successfully
 */
router.put(
  "/updateuserrole/:id",
  protectRoute,
  superAdminRoute,
  updateUserRole
);
//two factor authentication

/**
 * @swagger
 * /auth/twofactor:
 *   post:
 *     summary: Enable or disable two-factor authentication
 *     tags: [TwoFactor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enable:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Two-factor updated successfully
 */
router.post("/twofactor", protectRoute, EnableTwoFactorAuthentication);
/**
 * @swagger
 * /auth/verify-2fa:
 *   post:
 *     summary: Verify 2FA OTP during login
 *     tags: [TwoFactor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Two-factor verified successfully
 */

router.post("/verify-2fa", verifyTwoFactorAuth);

/**
 * @swagger
 * /auth/check-verification:
 *   get:
 *     summary: Check user identity verification status
 *     tags: [User]
 *     description: |
 *       This endpoint checks if the user's identity has been verified.
 *     responses:
 *       200:
 *         description: User verification status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                   example: true
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error while checking verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Server error
 */

router.post("/check-verification", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ verified: user.identityVerified === true });
  } catch (err) {
    console.error("Check verification error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.get("/stripe-verify", (req, res) => {
  // Not reading session_id or status
  const deepLink = "https://verify.stripe.test/close";
  res.redirect(deepLink);
});
/**
 * @swagger
 * /auth/verify-account:
 *   post:
 *     summary: Create a Stripe identity verification session
 *     tags: [User]
 *     description: |
 *       This endpoint creates a Stripe Identity Verification Session for the authenticated user.
 *       The session details (ID, client secret, and verification URL) are returned to initiate the verification flow.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stripe verification session created successfully
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
 *                   example: Proceed with Stripe verification in-app.
 *                 verificationSessionId:
 *                   type: string
 *                   example: vs_1RxXIuPfjXlwgFldQptvmX6t
 *                 clientSecret:
 *                   type: string
 *                   example: vs_1RxXIuPfjXlwgFldQptvmX6t_secret_test_xxxxx
 *                 verificationUrl:
 *                   type: string
 *                   example: https://verify.stripe.com/start/vs_12345
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unauthorized
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Server error while creating Stripe verification session
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Something went wrong
 */
router.post("/verify-account", verifyAccount);
/**
 * @swagger
 * /auth/approve-user/{userId}:
 *   put:
 *     summary: Approve a user's identity verification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to approve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User approved successfully
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
 *                   example: User approved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/approve-user/:userId", protectRoute,superAdminRoute, approveUser);

/**
 * @swagger
 * /auth/reject-user/{userId}:
 *   put:
 *     summary: Reject a user's identity verification
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         description: ID of the user to reject
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User rejected successfully
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
 *                   example: User rejected successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/reject-user/:userId", protectRoute,superAdminRoute, RejectUser);
/**
 * @swagger
 * /auth/certificate:
 *   post:
 *     summary: Upload certificate files (images or PDFs)
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload up to 5 certificate files (JPG, PNG, PDF)
 *     responses:
 *       200:
 *         description: Certificates uploaded successfully
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
 *                   example: Certificates uploaded successfully
 *                 certificates:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: uploads/images/1692909834-certificate.png
 *       400:
 *         description: No files uploaded or invalid file type
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

router.post(
  "/certificate",
  protectRoute,
  uploadImages.array("certificates", 5),
  handleFileUploadErrors,
  uploadCertificate
);
/**
 * @swagger
 * /auth/delete:
 *   delete:
 *     summary: Delete logged-in user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: Account deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete("/delete", protectRoute, deleteMyAccount);
/**
 * @swagger
 * /auth/switch-role:
 *   put:
 *     summary: Switch user role between Client and Professional
 *     description: >
 *       - Switch a Client to Professional role if they have at least one service.
 *       - Returns error if services are null or empty.
 *       - Switch a Professional back to Client, nothing else is modified.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Role switched successfully
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
 *                   example: Role changed to Professional. Please complete KYC.
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       example: Professional
 *       400:
 *         description: Service is null
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Service is null
 *       403:
 *         description: SuperAdmin role cannot be changed
 *       404:
 *         description: User not found
 */

router.put("/switch-role", protectRoute, switchRole);
/**
 * @swagger
 * /auth/professional-kyc:
 *   put:
 *     summary: Update Professional KYC
 *     description: >
 *       Updates professional-only fields, links at least one service, and allows uploading certificates.  
 *       Only accessible for users with **Professional** role.  
 *       At least one valid service ID is required from the predefined services list.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - services
 *             properties:
 *               services:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of service IDs (must include at least one)
 *                 example: ["64fb12c34ab56d7f890a1234"]
 *               bio:
 *                 type: string
 *                 description: Optional bio for Professional
 *               skills:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional skills array
 *               yearsOfExperience:
 *                 type: integer
 *                 description: Optional years of experience
 *               hourlyRate:
 *                 type: number
 *                 description: Optional hourly rate
 *               specialization:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Optional specialization array
 *               certificates:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional certificate files (max 5)
 *     responses:
 *       200:
 *         description: Professional KYC updated successfully
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
 *                   example: Professional KYC updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     bio:
 *                       type: string
 *                       example: "Experienced Web Developer"
 *                     skills:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["React", "Node.js"]
 *                     yearsOfExperience:
 *                       type: integer
 *                       example: 5
 *                     hourlyRate:
 *                       type: number
 *                       example: 25
 *                     specialization:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Full Stack Development"]
 *                     certificates:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["/uploads/cert1.png"]
 *                     services:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["64fb12c34ab56d7f890a1234"]
 *                     isProfessionalKycSubmited:
 *                       type: boolean
 *                       example: true
 *                     isProfessionalKycVerified:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Validation error (e.g. missing services, not Professional role)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: At least one service is required to submit Professional KYC
 *       404:
 *         description: User not found
 */
router.put(
  "/professional-kyc",
  protectRoute,
  uploadImages.array("certificates", 5),
  handleFileUploadErrors,
  updateProfessionalKyc
);

module.exports = router;
