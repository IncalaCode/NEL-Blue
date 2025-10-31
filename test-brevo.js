require('dotenv').config();
const { sendEmail } = require('./config/brevo');
const { loadTemplate, renderTemplate } = require('./utils/emailTemplates');

async function testBrevo() {
  try {
    console.log('🧪 Testing Brevo email service...');
    
    // Load and render template
    const template = loadTemplate('verification-code');
    const htmlContent = renderTemplate(template, {
      verificationCode: '123456'
    });
    
    const result = await sendEmail({
      to: 'kalebademkisho@gmail.com',
      subject: 'NEL Blue - Brevo Test Email',
      text: 'Your verification code is: 123456',
      html: htmlContent
    });
    
    console.log('✅ Email sent successfully!');
    console.log('Response:', result);
  } catch (error) {
    console.error('❌ Email failed:', error);
  }
}

testBrevo();