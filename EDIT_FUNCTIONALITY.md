# Edit Functionality - Jobs and Advertisements

This document outlines the newly added edit functionality for Jobs and Advertisements in the NEL-Blue backend API.

## 🆕 New Features Added

### 1. Edit Jobs
- **Endpoint**: `PUT /api/jobs/:id`
- **Authentication**: Required (Bearer token)
- **Authorization**: Only job creator can edit their own jobs

#### Editable Fields:
- `serviceId` - Service category
- `ratePerHour` - Hourly rate
- `location` - Job location
- `skills` - Required skills array
- `description` - Job description
- `duration` - Job duration in hours
- `appointmentDate` - Scheduled date
- `appointmentTime` - Scheduled time

#### Restrictions:
- Cannot edit jobs with status "in-progress" or "completed"
- Only the job creator can edit their jobs
- Validation ensures data integrity

### 2. Edit Advertisements
- **Endpoint**: `PUT /api/advertisement/:id`
- **Authentication**: Required (Bearer token)
- **Authorization**: Only advertisement owner can edit their ads

#### Editable Fields:
- `serviceId` - Service category
- `price` - Service price
- `location` - Service location
- `skills` - Skills/specializations array
- `description` - Service description
- `available` - Availability status (boolean)

#### New Supporting Endpoint:
- **Get Advertisement by ID**: `GET /api/advertisement/:id`
- Returns detailed advertisement information

## 🔧 Implementation Details

### Job Edit Controller (`updateJob`)
```javascript
// Enhanced with:
- Status validation (prevents editing in-progress/completed jobs)
- Field filtering (only allowed fields can be updated)
- Proper error handling
- Population of related data
- Improved response format
```

### Advertisement Edit Controller (`updateAdvertisement`)
```javascript
// New implementation includes:
- Authorization checks
- Field validation
- Partial update support
- Related data population
- Consistent response format
```

## 📝 API Usage Examples

### Edit a Job
```bash
PUT /api/jobs/60f7b3b3b3b3b3b3b3b3b3b3
Authorization: Bearer <token>
Content-Type: application/json

{
  "ratePerHour": 75,
  "location": "Updated Location",
  "description": "Updated job description",
  "skills": ["JavaScript", "Node.js", "React"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Job updated successfully",
  "job": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "ratePerHour": 75,
    "location": "Updated Location",
    "description": "Updated job description",
    "skills": ["JavaScript", "Node.js", "React"],
    "serviceId": { ... },
    "createdBy": { ... },
    ...
  }
}
```

### Edit an Advertisement
```bash
PUT /api/advertisement/60f7b3b3b3b3b3b3b3b3b3b3
Authorization: Bearer <token>
Content-Type: application/json

{
  "price": 150,
  "location": "Updated Service Area",
  "available": false,
  "skills": ["Plumbing", "Repair", "Installation"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Advertisement updated successfully",
  "advertisement": {
    "_id": "60f7b3b3b3b3b3b3b3b3b3b3",
    "price": 150,
    "location": "Updated Service Area",
    "available": false,
    "skills": ["Plumbing", "Repair", "Installation"],
    "serviceId": { ... },
    "professionalId": { ... },
    ...
  }
}
```

## 🛡️ Security & Validation

### Authorization
- JWT token required for all edit operations
- Users can only edit their own jobs/advertisements
- Proper error messages for unauthorized attempts

### Validation
- Field validation using Mongoose schemas
- Prevents editing jobs that are in-progress or completed
- Supports partial updates (only provided fields are updated)
- Maintains data integrity with `runValidators: true`

### Error Handling
- **400**: Bad request (invalid data, cannot edit in-progress jobs)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (not the owner)
- **404**: Not found (job/advertisement doesn't exist)
- **500**: Server error

## 🧪 Testing

### Test Coverage
- ✅ Successful edit operations
- ✅ Authorization checks
- ✅ Partial updates
- ✅ Error scenarios (404, 403, 400)
- ✅ Data validation
- ✅ Field filtering

### Test Files
- `tests/edit-functionality.test.js` - Comprehensive test suite
- `demo-edit-functionality.js` - Interactive demo script

### Running Tests
```bash
# Run edit functionality tests
npm test -- tests/edit-functionality.test.js

# Run demo script (requires server to be running)
node demo-edit-functionality.js
```

## 📊 Swagger Documentation

Both endpoints are fully documented in Swagger UI:
- Visit `http://localhost:5000/api-docs`
- Navigate to Jobs or Advertisement sections
- Find the PUT endpoints with complete request/response schemas

## 🔄 Integration with Existing Features

### Metrics Update
- User metrics are automatically updated when advertisements are modified
- Maintains consistency with existing metric tracking

### Population
- Related data (serviceId, createdBy, professionalId) is populated in responses
- Provides complete information for frontend consumption

### Backward Compatibility
- All existing endpoints remain unchanged
- New functionality is additive, not breaking

## 🚀 Usage in Frontend

### React/JavaScript Example
```javascript
// Edit a job
const editJob = async (jobId, updateData) => {
  try {
    const response = await fetch(`/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Job updated:', result.job);
    }
  } catch (error) {
    console.error('Edit failed:', error);
  }
};

// Edit an advertisement
const editAdvertisement = async (adId, updateData) => {
  try {
    const response = await fetch(`/api/advertisement/${adId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });
    
    const result = await response.json();
    if (result.success) {
      console.log('Advertisement updated:', result.advertisement);
    }
  } catch (error) {
    console.error('Edit failed:', error);
  }
};
```

## 📋 Summary

The edit functionality provides:
- ✅ Complete CRUD operations for Jobs and Advertisements
- ✅ Secure, authorized editing with proper validation
- ✅ Flexible partial updates
- ✅ Comprehensive error handling
- ✅ Full Swagger documentation
- ✅ Extensive test coverage
- ✅ Easy frontend integration

This enhancement significantly improves the user experience by allowing users to modify their posted jobs and advertisements without having to delete and recreate them.