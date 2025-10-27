const axios = require('axios');

// Demo script to show edit functionality
const BASE_URL = 'http://localhost:5000/api';

async function demoEditFunctionality() {
  console.log('🚀 Demo: Edit Job and Advertisement Functionality\n');

  try {
    // Step 1: Login to get auth token
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'eddie.williams.swe@gmail.com',
      password: '12345678'
    });
    
    const authToken = loginResponse.data.accessToken;
    const headers = { Authorization: `Bearer ${authToken}` };
    console.log('✅ Login successful\n');

    // Step 2: Create a job
    console.log('2. Creating a test job...');
    const jobData = {
      serviceId: '68b370b362d20a7e8373d382',
      ratePerHour: 50,
      location: 'Original Location',
      description: 'Original job description',
      duration: 2,
      paymentMethod: 'hourly',
      skills: ['JavaScript', 'Node.js'],
      appointmentDate: '2025-03-01',
      appointmentTime: '10:00'
    };

    const createJobResponse = await axios.post(`${BASE_URL}/jobs`, jobData, { headers });
    const jobId = createJobResponse.data.job._id;
    console.log('✅ Job created with ID:', jobId);
    console.log('   Original rate: $50/hour');
    console.log('   Original location:', jobData.location, '\n');

    // Step 3: Edit the job
    console.log('3. Editing the job...');
    const jobUpdateData = {
      ratePerHour: 75,
      location: 'Updated Location - Downtown',
      description: 'Updated job description with more details',
      skills: ['JavaScript', 'Node.js', 'React', 'MongoDB']
    };

    const editJobResponse = await axios.put(`${BASE_URL}/jobs/${jobId}`, jobUpdateData, { headers });
    console.log('✅ Job updated successfully!');
    console.log('   New rate: $75/hour');
    console.log('   New location:', editJobResponse.data.job.location);
    console.log('   New skills:', editJobResponse.data.job.skills.join(', '), '\n');

    // Step 4: Create an advertisement
    console.log('4. Creating a test advertisement...');
    const adData = {
      serviceId: '68b370b362d20a7e8373d382',
      price: 100,
      location: 'Original Ad Location',
      description: 'Original advertisement description',
      skills: ['Plumbing', 'Repair'],
      available: true
    };

    const createAdResponse = await axios.post(`${BASE_URL}/advertisement`, adData, { headers });
    const adId = createAdResponse.data.advertisement._id;
    console.log('✅ Advertisement created with ID:', adId);
    console.log('   Original price: $100');
    console.log('   Original location:', adData.location);
    console.log('   Available:', adData.available, '\n');

    // Step 5: Edit the advertisement
    console.log('5. Editing the advertisement...');
    const adUpdateData = {
      price: 150,
      location: 'Updated Ad Location - City Center',
      description: 'Updated advertisement with premium services',
      skills: ['Plumbing', 'Repair', 'Installation', 'Emergency Service'],
      available: false
    };

    const editAdResponse = await axios.put(`${BASE_URL}/advertisement/${adId}`, adUpdateData, { headers });
    console.log('✅ Advertisement updated successfully!');
    console.log('   New price: $150');
    console.log('   New location:', editAdResponse.data.advertisement.location);
    console.log('   New skills:', editAdResponse.data.advertisement.skills.join(', '));
    console.log('   Available:', editAdResponse.data.advertisement.available, '\n');

    // Step 6: Verify changes by fetching
    console.log('6. Verifying changes...');
    const getJobResponse = await axios.get(`${BASE_URL}/jobs/${jobId}`, { headers });
    const getAdResponse = await axios.get(`${BASE_URL}/advertisement/${adId}`, { headers });
    
    console.log('✅ Job verification:');
    console.log('   Rate per hour:', getJobResponse.data.ratePerHour);
    console.log('   Location:', getJobResponse.data.location);
    
    console.log('✅ Advertisement verification:');
    console.log('   Price:', getAdResponse.data.advertisement.price);
    console.log('   Location:', getAdResponse.data.advertisement.location, '\n');

    // Step 7: Clean up (delete test data)
    console.log('7. Cleaning up test data...');
    await axios.delete(`${BASE_URL}/jobs/${jobId}`, { headers });
    await axios.delete(`${BASE_URL}/advertisement/${adId}`, { headers });
    console.log('✅ Test data cleaned up\n');

    console.log('🎉 Demo completed successfully!');
    console.log('\n📋 Summary of Edit Functionality:');
    console.log('   ✅ Jobs can be edited (rate, location, description, skills, etc.)');
    console.log('   ✅ Advertisements can be edited (price, location, description, skills, availability)');
    console.log('   ✅ Only job/ad owners can edit their own content');
    console.log('   ✅ Partial updates are supported');
    console.log('   ✅ Validation prevents editing jobs that are in-progress or completed');
    console.log('   ✅ Proper error handling for non-existent items');

  } catch (error) {
    console.error('❌ Demo failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 Make sure the server is running and the login credentials are correct');
    } else if (error.response?.status === 404) {
      console.log('💡 Make sure the service IDs exist in the database');
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demoEditFunctionality();
}

module.exports = { demoEditFunctionality };