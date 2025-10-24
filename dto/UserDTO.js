const ServiceDTO = require('./ServiceDTO');

/**
 * User Data Transfer Object
 * Ensures consistent user object structure across all API responses
 * Matches the Dart User model exactly
 */
class UserDTO {
  static toResponse(user) {
    return {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email,
      role: user.role,
      services: ServiceDTO.toResponseArray(user.services),
      availabilty: user.availabilty,
      bio: user.bio,
      skills: user.skills || [],
      yearsOfExperience: user.yearsOfExperience,
      hourlyRate: user.hourlyRate,
      certificates: user.certificates || [],
      identityVerified: user.identityVerified,
      isClientIdentityVerified: user.isClientIdentityVerified,
      isClientIdentitySubmited: user.isClientIdentitySubmited,
      isProfessionalKycVerified: user.isProfessionalKycVerified,
      isProfessionalKycSubmited: user.isProfessionalKycSubmited,
      metrics: user.metrics || {
        completedAppointments: 0,
        activeAppointments: 0,
        advertisedServices: 0,
        allAppointments: 0,
        totalClients: 0
      },
    };
  }

  // For availability toggle endpoint (uses different field names)
  static toAvailabilityResponse(user) {
    return {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      availability: user.availabilty,
      services: ServiceDTO.toResponseArray(user.services),
      bio: user.bio,
      skills: user.skills || [],
      yearsOfExperience: user.yearsOfExperience,
      hourlyRate: user.hourlyRate,
      certificates: user.certificates || [],
      specialization: user.specialization || [],
      identityVerified: user.identityVerified,
      isClientIdentityVerified: user.isClientIdentityVerified,
      isClientIdentitySubmited: user.isClientIdentitySubmited,
      isProfessionalKycVerified: user.isProfessionalKycVerified,
      isProfessionalKycSubmited: user.isProfessionalKycSubmited,
      metrics: user.metrics || {
        completedAppointments: 0,
        activeAppointments: 0,
        advertisedServices: 0,
        allAppointments: 0,
        totalClients: 0
      },
    };
  }
}

module.exports = UserDTO;