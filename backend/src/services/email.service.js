const nodemailer = require('nodemailer');

let transporter;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  await t.sendMail({
    from: process.env.SMTP_FROM || 'noreply@example.com',
    to,
    subject,
    html,
  });
};

const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `<p>Click <a href="${url}">here</a> to verify your email. This link expires in 24 hours.</p>`,
  });
};

const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${url}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  });
};

const sendNotificationEmail = async ({ to, name, type, title, message, referenceType, referenceId }) => {
  const typeLabels = {
    ASSIGNMENT: 'Asset Assignment',
    MAINTENANCE: 'Maintenance Update',
    WARRANTY_EXPIRY: 'Warranty Expiry Notice',
    APPROVAL_REQUEST: 'Approval Request',
    APPROVED: 'Request Approved',
    REJECTED: 'Request Rejected',
    SYSTEM: 'System Notification',
  };
  const label = typeLabels[type] || 'Notification';
  await sendEmail({
    to,
    subject: `${label}: ${title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${label}</h2>
        <p>Hello ${name},</p>
        <p>${message}</p>
        ${referenceType && referenceId ? `<p style="color: #666; font-size: 12px;">Reference: ${referenceType} / ${referenceId}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee;" />
        <p style="color: #999; font-size: 11px;">This is an automated notification. Please do not reply.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail, sendNotificationEmail };
