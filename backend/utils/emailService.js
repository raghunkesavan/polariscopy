import nodemailer from 'nodemailer';
import logger from './logger.js';

/**
 * Email service for sending notifications
 * Uses Gmail SMTP or other email providers
 */

// Create reusable transporter
let transporter = null;

function createTransporter() {
  if (transporter) return transporter;

  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  };

  // Only create transporter if credentials are provided
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    logger.warn('Email credentials not configured. Email notifications will be disabled.');
    return null;
  }

  transporter = nodemailer.createTransport(emailConfig);

  // Verify connection configuration
  transporter.verify(function (error, success) {
    if (error) {
      logger.error('Email server connection failed:', error);
    } else {
      logger.info('Email server is ready to send messages');
    }
  });

  return transporter;
}

/**
 * Send support request notification email
 * @param {Object} supportRequest - The support request data
 * @param {string} supportRequest.name - Name of the person submitting
 * @param {string} supportRequest.email - Email of the person submitting
 * @param {string} supportRequest.bugType - Type of bug/issue
 * @param {string} supportRequest.suggestion - Suggestion/description
 * @param {string} supportRequest.page - Page where issue occurred
 */
export async function sendSupportRequestNotification(supportRequest) {
  const smtp = createTransporter();
  
  if (!smtp) {
    logger.warn('Email not configured. Skipping notification for support request.');
    return { success: false, message: 'Email not configured' };
  }

  const recipientEmail = process.env.SUPPORT_EMAIL || process.env.SMTP_USER;

  if (!recipientEmail) {
    logger.error('SUPPORT_EMAIL not configured. Cannot send notification.');
    return { success: false, message: 'Recipient email not configured' };
  }

  const { name, email, bugType, suggestion, page } = supportRequest;

  const mailOptions = {
    from: `"Polaris Support System" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: `🆘 New Support Request: ${bugType || 'General'} - ${page}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a5276; border-bottom: 2px solid #1a5276; padding-bottom: 10px;">
          New Support Request Received
        </h2>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>From:</strong> ${name}</p>
          <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p style="margin: 10px 0;"><strong>Issue Type:</strong> ${bugType || 'Not specified'}</p>
          <p style="margin: 10px 0;"><strong>Page:</strong> ${page || 'Not specified'}</p>
        </div>
        
        <div style="margin: 20px 0;">
          <h3 style="color: #34495e;">Details:</h3>
          <div style="background-color: #ffffff; border-left: 4px solid #3498db; padding: 15px; margin: 10px 0;">
            ${suggestion ? suggestion.replace(/\n/g, '<br>') : '<em>No details provided</em>'}
          </div>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated notification from the Polaris Support System.</p>
          <p>Please respond to <a href="mailto:${email}">${email}</a> to address this request.</p>
        </div>
      </div>
    `,
    text: `
New Support Request Received

From: ${name}
Email: ${email}
Issue Type: ${bugType || 'Not specified'}
Page: ${page || 'Not specified'}

Details:
${suggestion || 'No details provided'}

---
Please respond to ${email} to address this request.
    `,
  };

  try {
    const info = await smtp.sendMail(mailOptions);
    logger.info('Support notification email sent:', {
      messageId: info.messageId,
      to: recipientEmail,
      from: email
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send support notification email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send confirmation email to the person who submitted the support request
 * @param {Object} supportRequest - The support request data
 */
export async function sendSubmitterConfirmation(supportRequest) {
  const smtp = createTransporter();
  
  if (!smtp) {
    logger.warn('Email not configured. Skipping confirmation email.');
    return { success: false, message: 'Email not configured' };
  }

  const { name, email, bugType, suggestion, page } = supportRequest;

  const mailOptions = {
    from: `"Polaris Support System" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '✅ Support Request Received - Polaris',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #27ae60; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">
          ✅ Your Support Request Has Been Received
        </h2>
        
        <p style="font-size: 16px; color: #333;">Hi ${name},</p>
        
        <p style="font-size: 14px; color: #555;">
          Thank you for contacting Polaris support. We've received your request and our team will review it shortly.
        </p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #34495e; margin-top: 0;">Your Request Details:</h3>
          <p style="margin: 10px 0;"><strong>Issue Type:</strong> ${bugType || 'General'}</p>
          <p style="margin: 10px 0;"><strong>Page:</strong> ${page || 'Not specified'}</p>
          <div style="margin-top: 15px;">
            <strong>Your Message:</strong>
            <div style="background-color: #ffffff; border-left: 4px solid #3498db; padding: 15px; margin-top: 10px;">
              ${suggestion ? suggestion.replace(/\n/g, '<br>') : '<em>No details provided</em>'}
            </div>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #555;">
          Our support team typically responds within 24-48 hours. If your issue is urgent, please contact us directly.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px;">
          <p>This is an automated confirmation email from the Polaris Support System.</p>
          <p>Please do not reply to this email. Our team will contact you at <strong>${email}</strong> soon.</p>
        </div>
      </div>
    `,
    text: `
Your Support Request Has Been Received

Hi ${name},

Thank you for contacting Polaris support. We've received your request and our team will review it shortly.

Your Request Details:
- Issue Type: ${bugType || 'General'}
- Page: ${page || 'Not specified'}
- Your Message: ${suggestion || 'No details provided'}

Our support team typically responds within 24-48 hours.

---
This is an automated confirmation. Our team will contact you at ${email} soon.
    `,
  };

  try {
    const info = await smtp.sendMail(mailOptions);
    logger.info('Confirmation email sent to submitter:', {
      messageId: info.messageId,
      to: email
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send confirmation email to submitter:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send password reset email
 * @param {Object} options - Reset email options
 * @param {string} options.email - User's email address
 * @param {string} options.name - User's name
 * @param {string} options.resetToken - Password reset token
 * @param {string} options.resetLink - Full reset link URL
 */
export async function sendPasswordResetEmail({ email, name, resetToken, resetLink }) {
  const smtp = createTransporter();
  
  if (!smtp) {
    logger.warn('Email not configured. Skipping password reset email.');
    return { success: false, message: 'Email not configured' };
  }

  const mailOptions = {
    from: `"Polaris Security" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🔐 Password Reset Request - Polaris',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Password Reset</h1>
        </div>
        
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
          <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Hi ${name || 'there'},</p>
          
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            We received a request to reset your password for your Polaris account. Click the button below to create a new password:
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="background-color: #667eea; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block;">
              Reset Password
            </a>
          </div>
          
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            Or copy and paste this link into your browser:
          </p>
          
          <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 15px 0; word-break: break-all;">
            <a href="${resetLink}" style="color: #667eea; text-decoration: none;">${resetLink}</a>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #856404;">
              <strong>⚠️ Security Notice:</strong><br>
              This link will expire in <strong>1 hour</strong> for security reasons.
            </p>
          </div>
          
          <p style="font-size: 14px; color: #555; line-height: 1.6;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.
          </p>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; margin-top: -1px;">
          <p style="margin: 5px 0; color: #666; font-size: 12px;">
            This is an automated security email from Polaris.
          </p>
          <p style="margin: 5px 0; color: #666; font-size: 12px;">
            © ${new Date().getFullYear()} Market Financial Services Ltd. All rights reserved.
          </p>
        </div>
      </div>
    `,
    text: `
Password Reset Request - Polaris

Hi ${name || 'there'},

We received a request to reset your password for your Polaris account.

To reset your password, click on the link below or copy and paste it into your browser:

${resetLink}

⚠️ SECURITY NOTICE:
This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email or contact support if you have concerns about your account security.

---
This is an automated security email from Polaris.
© ${new Date().getFullYear()} Market Financial Services Ltd.
    `,
  };

  try {
    const info = await smtp.sendMail(mailOptions);
    logger.info('Password reset email sent:', {
      messageId: info.messageId,
      to: email
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send test email to verify configuration
 */
export async function sendTestEmail(recipientEmail) {
  const smtp = createTransporter();
  
  if (!smtp) {
    throw new Error('Email not configured');
  }

  const mailOptions = {
    from: `"Polaris System" <${process.env.SMTP_USER}>`,
    to: recipientEmail,
    subject: '✅ Email Configuration Test',
    html: `
      <h2>Email Configuration Successful!</h2>
      <p>This is a test email to verify that your email service is working correctly.</p>
      <p>If you received this, your SMTP settings are configured properly.</p>
    `,
  };

  const info = await smtp.sendMail(mailOptions);
  logger.info('Test email sent:', info.messageId);
  return info;
}

export default {
  sendSupportRequestNotification,
  sendPasswordResetEmail,
  sendTestEmail
};
