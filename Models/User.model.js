const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = mongoose.Schema(
  {
    googleId: { type: String },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /@gmail\.com$/.test(v);
        },
        message: (props) =>
          `${props.value} must be a valid Gmail address ending with @gmail.com`,
      },
    },
    services: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
      },
    ],
    city: { type: String },
    state: { type: String },
    country: { type: String },
    password: {
      type: String,
      minlength: 6,
      required: function () {
        return !this.googleId; // only require if no Google login
      },
    },
    role: {
      type: String,
      enum: ["Client", "Professional", "SuperAdmin"],
      required: true,
      default: "Client",
    },
    bio: { type: String },
    skills: { type: [String] },
    yearsOfExperience: { type: Number },
    hourlyRate: { type: Number },
    isClientIdentityVerified: { type: Boolean, default: false },
    isClientIdentitySubmited: { type: Boolean, default: false },
    isProfessionalKycVerified: { type: Boolean, default: false },
    isProfessionalKycSubmited: { type: Boolean, default: false },
    specialization: { type: [String] },
    address: { type: String },
    zipCode: { type: String },
    availabilty: { type: String },
    certificates: { type: [String], default: [] },
    stripeAccountId: { type: String }, // connected account for professional
    identityVerified: { type: Boolean, default: false },
    payoutStatus: {
      type: String,
      enum: ["Pending", "Enabled", "Disabled"],
      default: "Pending",
    },

    profileImage: { type: String },
    phone: { type: String },
    twoFactorEnabled: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    stripeVerificationSessionId: { type: String },
  },
  {
    timestamps: true,
    indexes: [
      { email: 1 }, // Add index for email since it's used for lookups
      { googleId: 1 },
      { phoneNumber: 1 },
    ],
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.role !== "Professional") {
    this.specialization = []; // clear specialization for non-professionals
  }
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
