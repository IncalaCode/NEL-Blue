const brevo = require('@getbrevo/brevo');

// Initialize Brevo API client
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendEmail = async ({ to, subject, text, html }) => {
  const sendSmtpEmail = new brevo.SendSmtpEmail();
  
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.sender = { 
    name: process.env.EMAIL_FROM_NAME || "NEL Blue", 
    email: process.env.EMAIL_FROM || "noreply@nelblue.com" 
  };
  
  if (html) {
    sendSmtpEmail.htmlContent = html;
  } else {
    sendSmtpEmail.textContent = text;
  }

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    return response;
  } catch (error) {
    console.error('Brevo email error:', error);
    throw error;
  }
};

module.exports = { sendEmail };