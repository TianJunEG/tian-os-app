/**
 * WhatsApp Message Templates
 * Pre-formatted messages for different conversation flows
 */

/**
 * Welcome message with subject selection buttons
 */
function subjectButtons() {
  return {
    type: 'buttons',
    body: `Welcome to [Platform Name]! 👋

I'll help you find a perfect tutor in minutes.

What subject does your child need help with?`,
    buttons: [
      { id: '1', title: '📚 English' },
      { id: '2', title: '🔢 Math' },
      { id: '3', title: '🧪 Science' },
      { id: '4', title: '🇨🇳 Chinese' },
      { id: '5', title: '🇲🇾 Malay' },
    ],
  };
}

/**
 * Level selection buttons
 */
function levelButtons(subject) {
  return {
    type: 'buttons',
    body: `Great! ${subject} it is.

What level is your child?`,
    buttons: [
      { id: '1', title: 'Primary (P1-P6)' },
      { id: '2', title: 'Secondary (Sec 1-2)' },
      { id: '3', title: 'O-Level (Sec 3-4)' },
      { id: '4', title: 'A-Level' },
      { id: '5', title: 'IB/International' },
    ],
  };
}

/**
 * Lesson frequency selection
 */
function frequencyButtons() {
  return {
    type: 'buttons',
    body: `Perfect! How often would you like lessons?`,
    buttons: [
      { id: '1', title: '1x per week' },
      { id: '2', title: '2x per week' },
      { id: '3', title: '3x per week' },
    ],
  };
}

/**
 * Area/location prompt (open-ended)
 */
function areaPrompt() {
  return {
    type: 'text',
    body: `Got it! 📍

In what area do you stay? (Type postal code or area name, e.g., Clementi, Bukit Timah, etc.)`,
  };
}

/**
 * No tutors found message
 */
function noTutorsFound(area) {
  return {
    type: 'text',
    body: `Hmm, we don't have any available tutors in ${area} right now.

Please try:
• Entering a nearby area
• Checking back tomorrow (we're onboarding new tutors!)
• Or reply with a different area name

What area would you like to try?`,
  };
}

/**
 * Display list of matching tutors
 */
function tutorListButtons(tutors) {
  if (!tutors || tutors.length === 0) {
    return noTutorsFound('this area');
  }

  let body = '📋 Great! I found tutors for you:\n\n';

  tutors.forEach((tutor, index) => {
    const moeTag = tutor.moe_teacher ? '✓ MOE' : '';
    const starRating = '⭐'.repeat(Math.floor(tutor.rating));

    body += `${index + 1}. *${tutor.name}* ${moeTag}\n`;
    body += `   💰 $${tutor.rate}/hr | ${starRating} ${tutor.rating}\n`;
    body += `   📝 ${tutor.specializations?.join(', ') || 'Specialist'}\n\n`;
  });

  body += `Reply with the number of your choice (1-${tutors.length})`;

  return {
    type: 'text',
    body,
  };
}

/**
 * Display individual tutor profile
 */
function tutorProfileMessage(tutor) {
  const moeTag = tutor.moe_teacher ? '✓ MOE Teacher' : 'Private Tutor';
  const starRating = '⭐'.repeat(Math.floor(tutor.rating));

  const body = `
*${tutor.name}* ${moeTag}
📍 ${tutor.area || 'Multiple Areas'}
💰 $${tutor.rate}/hr
${starRating} ${tutor.rating} (${tutor.reviews || '0'} reviews)
📅 Experience: ${tutor.experience} years

📝 Specializations: ${tutor.specializations?.join(', ') || 'N/A'}

"${tutor.bio || 'Expert tutor ready to help'}"

✅ Book a FREE trial lesson
Reply "BOOK" to confirm, or choose another tutor`;

  return {
    type: 'text',
    body,
  };
}

/**
 * Tutor selection confirmation
 */
function tutorConfirmationMessage(tutor) {
  return {
    type: 'text',
    body: `Excellent choice! 🎉

You've selected *${tutor.name}* (💰 $${tutor.rate}/hr)

I'm connecting you now...
⏳ They typically reply within 15 minutes.

In the meantime:
✓ The first lesson is FREE to try
✓ No commitment required
✓ You can switch tutors anytime

${tutor.whatsapp_number ? `They'll contact you at this number or message you directly.` : ''}

Thanks for choosing us!`,
  };
}

/**
 * Handoff confirmation message
 */
function handoffConfirmation(tutorName) {
  return {
    type: 'text',
    body: `🎉 Perfect!

${tutorName} has been notified and will contact you shortly.

💡 Tips:
• Keep WhatsApp available for their message
• Tell them about your learning goals
• Ask about lesson timing and trial

Need something else? Just reply here anytime!`,
  };
}

/**
 * Generic error message
 */
function errorMessage(message = 'Oops! Something went wrong.') {
  return {
    type: 'text',
    body: `❌ ${message}

Please try again or type "START" to restart.`,
  };
}

/**
 * Timeout message (user inactive)
 */
function timeoutMessage() {
  return {
    type: 'text',
    body: `😴 We noticed you've been inactive.

Your session will expire soon. Reply anytime to continue looking for a tutor!

Type "START" to restart from the beginning.`,
  };
}

/**
 * Follow-up message (post-session)
 */
function followUpMessage(tutorName) {
  return {
    type: 'buttons',
    body: `How was your lesson with ${tutorName}? ⭐

We'd love your feedback!`,
    buttons: [
      { id: '1', title: '⭐⭐⭐⭐⭐ Excellent' },
      { id: '2', title: '⭐⭐⭐⭐ Good' },
      { id: '3', title: '⭐⭐⭐ Okay' },
      { id: '4', title: '⭐⭐ Needs Improvement' },
      { id: '5', title: '⭐ Not A Fit' },
    ],
  };
}

/**
 * Reminder message (24 hours before lesson)
 */
function lessonReminderMessage(tutorName, lessonTime) {
  return {
    type: 'text',
    body: `⏰ Reminder: Your lesson with ${tutorName} is in 2 hours!

Time: ${lessonTime}

See you soon! 📚`,
  };
}

/**
 * Referral message (encourage sharing)
 */
function referralMessage() {
  return {
    type: 'text',
    body: `👥 Share and Earn!

Refer a friend and get $200 SGD per successful booking!

Your referral link: https://[platform]/ref/[code]

Share with friends & parents 📲`,
  };
}

/**
 * Help/FAQ message
 */
function helpMessage() {
  return {
    type: 'text',
    body: `📞 Need Help?

• To find a tutor: Reply "START"
• View my bookings: Reply "BOOKINGS"
• Referral rewards: Reply "REFER"
• FAQ: Reply "FAQ"
• Cancel lesson: Reply "CANCEL"
• Contact us: Reply "CONTACT"

What would you like to do?`,
  };
}

module.exports = {
  subjectButtons,
  levelButtons,
  frequencyButtons,
  areaPrompt,
  noTutorsFound,
  tutorListButtons,
  tutorProfileMessage,
  tutorConfirmationMessage,
  handoffConfirmation,
  errorMessage,
  timeoutMessage,
  followUpMessage,
  lessonReminderMessage,
  referralMessage,
  helpMessage,
};
