const User=require("../Models/User.model");
const UserDTO = require("../dto/UserDTO");
const Service=require("../Models/Service.model")
const Feedback=require("../Models/FeedBack.model")
const asyncHandler = require("express-async-handler");

const getAvailableMechanics = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const mechanics = await User.find({ 
      availabilty: "Available",
      services: { $exists: true, $ne: [] }
    })
      .select("-password -resetPasswordToken -resetPasswordExpires")
      .populate("services")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({ 
      availabilty: "Available",
      services: { $exists: true, $ne: [] }
    });

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
      services: service._id,
      availabilty: "Available"
    })
      .populate("services")
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments({
      services: service._id,
      availabilty: "Available"
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
      latitude,
      longitude,
      radius = 10,
      minPrice, 
      maxPrice, 
      page = 1, 
      limit = 10 
    } = req.query;
    const skip = (page - 1) * limit;

    let filter = { 
      availabilty: "Available",
      services: { $exists: true, $ne: [] }
    };

    // Geospatial search (optional) - takes priority over text location
    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusInMeters = parseFloat(radius) * 1000;
      
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        filter.location = {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat]
            },
            $maxDistance: radiusInMeters
          }
        };
      }
    }
    // Text-based location search (fallback)
    else if (location) {
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

        let distance = null;
        if (latitude && longitude && prof.location?.coordinates) {
          const [profLng, profLat] = prof.location.coordinates;
          const R = 6371;
          const dLat = (profLat - parseFloat(latitude)) * Math.PI / 180;
          const dLng = (profLng - parseFloat(longitude)) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                   Math.cos(parseFloat(latitude) * Math.PI / 180) * Math.cos(profLat * Math.PI / 180) *
                   Math.sin(dLng/2) * Math.sin(dLng/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          distance = (R * c).toFixed(2);
        }

        return {
          ...UserDTO.toResponse(prof),
          averageRating: avgRating,
          totalFeedbacks: feedbacks.length,
          distance: distance,
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
        coordinates: (latitude && longitude) ? { latitude, longitude, radius } : null,
        priceRange: (minPrice || maxPrice) ? { min: minPrice, max: maxPrice } : null
      },
      locationUsed: {
        lat: latitude ? parseFloat(latitude) : null,
        long: longitude ? parseFloat(longitude) : null,
        radius: (latitude && longitude) ? parseFloat(radius) : null,
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