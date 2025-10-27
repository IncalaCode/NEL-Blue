const User=require("../Models/User.model");
const UserDTO = require("../dto/UserDTO");
const Service=require("../Models/Service.model")
const Feedback=require("../Models/FeedBack.model")
const asyncHandler = require("express-async-handler");

const getAvailableMechanics = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const mechanics = await User.find({ role: "Professional", availabilty: "Available" })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("services")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ role: "Professional", availabilty: "Available" });

    const mechanicDetails = await Promise.all(
      mechanics.map(async (mechanic) => {
        const feedbacks = await Feedback.find({ userId: mechanic._id });
        const avgRating =
          feedbacks.length > 0
            ? (
                feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
              ).toFixed(1)
            : null;

        return {
          ...UserDTO.toResponse(mechanic),
          averageRating: avgRating,
          totalFeedbacks: feedbacks.length,
        };
      })
    );

    res.status(200).json({
      success: true,
      message: "Professionals retrieved successfully",
      locationUsed: {
        lat: null,
        long: null,
        country: null,
        region: null,
        city: null
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: mechanicDetails
    });
  } catch (error) {
    console.error("Get Mechanics Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

const getProfessionalsByCategory = asyncHandler(async (req, res) => {
  try {
    const { serviceName, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const service = await Service.findOne({ serviceName });
    if (!service) {
      return res.status(404).json({ success: false, message: "Service not found" });
    }

    const professionals = await User.find({
      role: "Professional",
      services: service._id
    })
      .populate("services")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      role: "Professional",
      services: service._id
    });

    res.status(200).json({
      success: true,
      message: "Professionals retrieved successfully",
      locationUsed: {
        lat: null,
        long: null,
        country: null,
        region: null,
        city: null
      },
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      },
      data: professionals.map(p => UserDTO.toResponse(p))
    });
  } catch (error) {
    console.error("Get Professionals By Category Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

const searchProfessionals = asyncHandler(async (req, res) => {
  try {
    const { 
      query, 
      serviceName, 
      isVerified, 
      badge,
      location,
      city,
      state,
      country,
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 10 
    } = req.query;
    const skip = (page - 1) * limit;

    let filter = { role: "Professional", availabilty: "Available" };

    // Text search in name
    if (query) {
      filter.$or = [
        { firstName: { $regex: query, $options: "i" } },
        { lastName: { $regex: query, $options: "i" } }
      ];
    }

    // Badge/Verification filters (optional)
    if (isVerified !== undefined) {
      filter.isProfessionalKycVerified = isVerified === "true";
    }
    
    if (badge) {
      switch (badge.toLowerCase()) {
        case "verified":
        case "kyc":
          filter.isProfessionalKycVerified = true;
          break;
        case "identity":
          filter.identityVerified = true;
          break;
        case "payout":
          filter.payoutStatus = "Enabled";
          break;
      }
    }

    // Location filters (optional)
    if (location) {
      filter.$or = [
        { city: { $regex: location, $options: "i" } },
        { state: { $regex: location, $options: "i" } },
        { country: { $regex: location, $options: "i" } },
        { address: { $regex: location, $options: "i" } }
      ];
    }
    
    if (city) {
      filter.city = { $regex: city, $options: "i" };
    }
    
    if (state) {
      filter.state = { $regex: state, $options: "i" };
    }
    
    if (country) {
      filter.country = { $regex: country, $options: "i" };
    }

    // Service filter
    if (serviceName) {
      const service = await Service.findOne({ serviceName });
      if (service) {
        filter.services = service._id;
      }
    }

    let professionals = await User.find(filter)
      .populate("services")
      .skip(skip)
      .limit(parseInt(limit));

    // Price range filter (applied after query for service-specific pricing)
    if (minPrice || maxPrice) {
      professionals = professionals.filter(prof => 
        prof.services.some(s => 
          (!minPrice || s.price?.min >= parseFloat(minPrice)) &&
          (!maxPrice || s.price?.max <= parseFloat(maxPrice))
        )
      );
    }

    // Add rating and feedback data
    const professionalsWithDetails = await Promise.all(
      professionals.map(async (prof) => {
        const feedbacks = await Feedback.find({ userId: prof._id });
        const avgRating = feedbacks.length > 0
          ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
          : null;

        return {
          ...UserDTO.toResponse(prof),
          averageRating: avgRating,
          totalFeedbacks: feedbacks.length,
          badges: {
            kycVerified: prof.isProfessionalKycVerified,
            identityVerified: prof.identityVerified,
            payoutEnabled: prof.payoutStatus === "Enabled"
          }
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: "Professionals retrieved successfully",
      filtersApplied: {
        query: query || null,
        serviceName: serviceName || null,
        badge: badge || null,
        location: location || null,
        city: city || null,
        state: state || null,
        country: country || null,
        priceRange: (minPrice || maxPrice) ? { min: minPrice, max: maxPrice } : null
      },
      locationUsed: {
        lat: null,
        long: null,
        country: country || null,
        region: state || null,
        city: city || null
      },
      pagination: {
        total: professionalsWithDetails.length,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(professionalsWithDetails.length / limit)
      },
      data: professionalsWithDetails
    });
  } catch (error) {
    console.error("Search Professionals Error:", error);
    res.status(500).json({ success: false, message: "Something went wrong" });
  }
});

module.exports = {
  getAvailableMechanics,
  getProfessionalsByCategory,
  searchProfessionals
}