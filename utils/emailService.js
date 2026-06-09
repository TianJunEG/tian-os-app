import nodemailer from 'nodemailer';

// Escape user-supplied values before interpolating into email HTML.
const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// Initialize email transporter
// For production: use a real email service (SendGrid, AWS SES, etc.)
// For development: use ethereal (fake email service for testing)
let transporter;

const initializeEmailService = async () => {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use your email service credentials
    transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Development: Use Ethereal (test email service)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }
};

// Initialize on module load
initializeEmailService().catch(console.error);

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML email body
 * @param {string} options.text - Plain text email body (optional)
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"TutorMatch" <noreply@tutormatch.com>',
      to,
      subject,
      text,
      html
    });

    console.log('Email sent:', info.messageId);

    // In development, log the preview URL
    if (process.env.NODE_ENV !== 'production') {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

/**
 * Send tutor verification approval email
 */
export const sendTutorApprovalEmail = async (tutor) => {
  const html = `
    <h2>Welcome to TutorMatch! 🎉</h2>
    <p>Hi ${tutor.name},</p>
    <p>Great news! Your tutor profile has been verified and approved. You can now start accepting bookings from students.</p>
    <h3>Next Steps:</h3>
    <ul>
      <li>Complete your profile information</li>
      <li>Set your availability</li>
      <li>Start accepting bookings</li>
    </ul>
    <p><a href="http://localhost:3000/tutor/dashboard" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a></p>
    <p>Best regards,<br>The TutorMatch Team</p>
  `;

  return sendEmail({
    to: tutor.email,
    subject: 'Your Tutor Profile Has Been Approved! 🎉',
    html
  });
};

/**
 * Send a parent/guardian an invite to view their child's school progress.
 */
export const sendParentInvite = async ({ to, studentName, schoolName, inviteUrl, expiresAt } = {}) => {
  const safeStudent = escapeHtml(studentName || 'your child');
  const safeSchool = escapeHtml(schoolName || 'their school');
  const expiryNote = expiresAt ? `<p style="color:#666;font-size:13px;">This invite expires on ${escapeHtml(new Date(expiresAt).toDateString())}.</p>` : '';
  const html = `
    <h2>You're invited to follow ${safeStudent}'s progress</h2>
    <p>${safeSchool} uses MathPath to track each student's mastery, skill by skill.</p>
    <p>You've been invited to a free, view-only parent dashboard so you can see how ${safeStudent} is doing and where they need support.</p>
    <p><a href="${inviteUrl}" style="background-color:#1F6B53;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;display:inline-block;">View ${safeStudent}'s progress</a></p>
    ${expiryNote}
    <p style="color:#666;font-size:13px;">If the button doesn't work, copy this link into your browser:<br>${escapeHtml(inviteUrl)}</p>
    <p>Best regards,<br>The MathPath Team</p>
  `;
  return sendEmail({ to, subject: `Follow ${studentName || 'your child'}'s progress on MathPath`, html });
};

/**
 * Send tutor verification rejection email
 */
export const sendTutorRejectionEmail = async (tutor, notes) => {
  const html = `
    <h2>Tutor Application Status</h2>
    <p>Hi ${tutor.name},</p>
    <p>Thank you for submitting your tutor application to TutorMatch. After careful review, we're unable to approve your profile at this time.</p>
    <h3>Reason:</h3>
    <p>${notes}</p>
    <p>You can reapply after addressing the feedback above.</p>
    <p><a href="http://localhost:3000/tutor/apply" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reapply Now</a></p>
    <p>Questions? Contact our support team.<br>Best regards,<br>The TutorMatch Team</p>
  `;

  return sendEmail({
    to: tutor.email,
    subject: 'Tutor Application Status Update',
    html
  });
};

/**
 * Send booking confirmation email
 */
export const sendBookingConfirmationEmail = async (parent, tutor, booking) => {
  const date = new Date(booking.scheduledDate).toLocaleDateString();
  const time = `${booking.startTime} - ${booking.endTime}`;

  const html = `
    <h2>Booking Confirmed! ✓</h2>
    <p>Hi ${parent.name},</p>
    <p>Your booking with ${tutor.name} has been confirmed!</p>
    <h3>Session Details:</h3>
    <ul>
      <li><strong>Tutor:</strong> ${tutor.name}</li>
      <li><strong>Subject:</strong> ${booking.subject}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
      <li><strong>Cost:</strong> $${booking.totalCost}</li>
    </ul>
    <p>Join Link: <a href="${booking.meetingLink}">${booking.meetingLink}</a></p>
    <p><a href="http://localhost:3000/bookings/${booking._id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Booking</a></p>
    <p>Best regards,<br>The TutorMatch Team</p>
  `;

  return sendEmail({
    to: parent.email,
    subject: `Booking Confirmed: ${booking.subject} with ${tutor.name}`,
    html
  });
};

/**
 * Send session reminder email
 */
export const sendSessionReminderEmail = async (user, booking, tutor) => {
  const date = new Date(booking.scheduledDate).toLocaleDateString();
  const time = booking.startTime;

  const html = `
    <h2>Session Reminder 📝</h2>
    <p>Hi ${user.name},</p>
    <p>Your tutoring session with ${tutor.name} is coming up soon!</p>
    <h3>Session Details:</h3>
    <ul>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Time:</strong> ${time}</li>
      <li><strong>Subject:</strong> ${booking.subject}</li>
    </ul>
    <p><a href="${booking.meetingLink}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Join Session</a></p>
    <p>See you soon!<br>The TutorMatch Team</p>
  `;

  return sendEmail({
    to: user.email,
    subject: `Reminder: Tutoring Session with ${tutor.name}`,
    html
  });
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmationEmail = async (parent, booking, amount) => {
  const date = new Date().toLocaleDateString();

  const html = `
    <h2>Payment Confirmed ✓</h2>
    <p>Hi ${parent.name},</p>
    <p>Thank you for your payment. Your transaction has been processed successfully.</p>
    <h3>Payment Details:</h3>
    <ul>
      <li><strong>Amount:</strong> $${amount}</li>
      <li><strong>Date:</strong> ${date}</li>
      <li><strong>Booking:</strong> ${booking.subject}</li>
    </ul>
    <p><a href="http://localhost:3000/payments" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Payment History</a></p>
    <p>Best regards,<br>The TutorMatch Team</p>
  `;

  return sendEmail({
    to: parent.email,
    subject: 'Payment Confirmation',
    html
  });
};

/**
 * Notify the team of a new partnership inquiry
 */
export const sendPartnerInquiryNotificationEmail = async (inquiry) => {
  const to =
    process.env.PARTNERSHIPS_NOTIFICATION_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.EMAIL_USER;

  if (!to) {
    console.warn('No partnership notification recipient configured; skipping email.');
    return;
  }

  const html = `
    <h2>New Partnership Inquiry 🤝</h2>
    <p>A new partnership inquiry was submitted.</p>
    <ul>
      <li><strong>Name:</strong> ${escapeHtml(inquiry.name)}</li>
      <li><strong>Organization:</strong> ${escapeHtml(inquiry.organization || 'N/A')}</li>
      <li><strong>Email:</strong> ${escapeHtml(inquiry.email)}</li>
    </ul>
    <h3>Message:</h3>
    <p>${escapeHtml(inquiry.message)}</p>
    <p>Review inquiries in the admin dashboard.</p>
  `;

  return sendEmail({
    to,
    subject: `New partnership inquiry from ${inquiry.name}`,
    html
  });
};

/**
 * Acknowledge a partnership inquiry to the person who submitted it
 */
export const sendPartnerInquiryAcknowledgementEmail = async (inquiry) => {
  const html = `
    <h2>Thanks for reaching out 🤝</h2>
    <p>Hi ${escapeHtml(inquiry.name)},</p>
    <p>Thank you for your interest in partnering with Tian Jun Education Group. We've received
    your message and our team will be in touch as partnership opportunities open up.</p>
    <p>Warm regards,<br>The Tian Jun Education Group Team</p>
  `;

  return sendEmail({
    to: inquiry.email,
    subject: 'We received your partnership inquiry',
    html
  });
};

export default {
  sendEmail,
  sendTutorApprovalEmail,
  sendTutorRejectionEmail,
  sendBookingConfirmationEmail,
  sendSessionReminderEmail,
  sendPaymentConfirmationEmail,
  sendPartnerInquiryNotificationEmail,
  sendPartnerInquiryAcknowledgementEmail
};
