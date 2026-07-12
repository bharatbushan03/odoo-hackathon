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

module.exports = { sendEmail, sendVerificationEmail, sendPasswordResetEmail };
