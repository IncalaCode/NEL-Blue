/**
 * Service Data Transfer Object
 * Ensures consistent service object structure matching Dart ServiceCategory model
 */
class ServiceDTO {
  static toResponse(service) {
    return {
      _id: service._id,
      serviceName: service.serviceName,
      category: service.category,
      price: {
        min: service.price?.min || 0,
        max: service.price?.max || 0
      }
    };
  }

  // Convert array of services
  static toResponseArray(services) {
    if (!Array.isArray(services)) return [];
    return services.map(service => this.toResponse(service));
  }
}

module.exports = ServiceDTO;