/**
 * Chatbot Controller
 * Main logic for conversation flow and tutor matching
 */

const logger = require('../utils/logger');
const conversationModel = require('../models/conversation');
const templates = require('../models/templates');
const { getRedisClient } = require('../services/redis');
const { searchTutors, logInteraction } = require('../services/database');
const { sendWhatsAppMessage } = require('../services/twilio');
const { validatePhoneNumber, sanitizeInput } = require('../utils/validators');

/**
 * Handle incoming message and route to appropriate handler
 */
async function handleIncomingMessage({ phoneNumber, message, messageId, senderName }) {
  // Validate phone number
  if (!validatePhoneNumber(phoneNumber)) {
    logger.warn('Invalid phone number', { phoneNumber });
    return null;
  }

  // Sanitize input
  const cleanMessage = sanitizeInput(message).trim().toUpperCase();

  // Get or create session
  let session = await conversationModel.getOrCreateSession(phoneNumber, senderName);
  logger.info('Session retrieved/created', {
    phoneNumber,
    sessionId: session.id,
    currentStep: session.current_step,
  });

  // Determine next action based on current step
  let response;
  switch (session.current_step) {
    case 'START':
      response = await handleStart(phoneNumber, session);
      break;

    case 'SUBJECT_SELECTED':
      response = await handleSubjectInput(phoneNumber, session, cleanMessage);
      break;

    case 'LEVEL_SELECTED':
      response = await handleLevelInput(phoneNumber, session, cleanMessage);
      break;

    case 'FREQUENCY_SELECTED':
      response = await handleFrequencyInput(phoneNumber, session, cleanMessage);
      break;

    case 'AREA_SELECTED':
      response = await handleAreaInput(phoneNumber, session, cleanMessage);
      break;

    case 'TUTOR_DISPLAYED':
      response = await handleTutorSelection(phoneNumber, session, cleanMessage);
      break;

    case 'HANDOFF':
      response = await handleHandoff(phoneNumber, session, cleanMessage);
      break;

    default:
      logger.warn('Unknown conversation step', {
        step: session.current_step,
        phoneNumber,
      });
      response = templates.errorMessage('Oops! Something went wrong. Please start over.');
  }

  // Log interaction
  await logInteraction({
    session_id: session.id,
    step: session.current_step,
    user_input: message,
    bot_response: response?.body || '',
    message_id: messageId,
  });

  // Send response
  if (response) {
    await sendWhatsAppMessage(phoneNumber, response);
  }

  return response;
}

/**
 * Step 1: Initial greeting
 */
async function handleStart(phoneNumber, session) {
  // Update session step
  await conversationModel.updateSessionStep(session.id, 'SUBJECT_SELECTED');

  // Return welcome + subject options
  return templates.subjectButtons();
}

/**
 * Step 2: Handle subject selection
 */
async function handleSubjectInput(phoneNumber, session, input) {
  const SUBJECTS = {
    '1': 'English',
    '2': 'Math',
    '3': 'Science',
    '4': 'Chinese',
    '5': 'Malay',
    'ENGLISH': 'English',
    'MATH': 'Math',
    'SCIENCE': 'Science',
    'CHINESE': 'Chinese',
    'MALAY': 'Malay',
  };

  const subject = SUBJECTS[input];
  if (!subject) {
    return templates.errorMessage('Invalid subject. Please select from the options.');
  }

  // Store subject in session state
  await conversationModel.updateSessionState(session.id, { subject });

  // Update step
  await conversationModel.updateSessionStep(session.id, 'LEVEL_SELECTED');

  // Return level options
  return templates.levelButtons(subject);
}

/**
 * Step 3: Handle level selection
 */
async function handleLevelInput(phoneNumber, session, input) {
  const LEVELS = {
    '1': 'Primary',
    '2': 'Secondary',
    '3': 'O-Level',
    '4': 'A-Level',
    '5': 'IB',
    'PRIMARY': 'Primary',
    'SECONDARY': 'Secondary',
    'O-LEVEL': 'O-Level',
    'A-LEVEL': 'A-Level',
    'IB': 'IB',
  };

  const level = LEVELS[input];
  if (!level) {
    return templates.errorMessage('Invalid level. Please select from the options.');
  }

  // Get current state
  const redis = await getRedisClient();
  const stateKey = `session:${session.id}:state`;
  const currentState = JSON.parse(await redis.get(stateKey) || '{}');

  // Store level in session
  await conversationModel.updateSessionState(session.id, { ...currentState, level });

  // Update step
  await conversationModel.updateSessionStep(session.id, 'FREQUENCY_SELECTED');

  // Return frequency options
  return templates.frequencyButtons();
}

/**
 * Step 4: Handle frequency selection
 */
async function handleFrequencyInput(phoneNumber, session, input) {
  const FREQUENCIES = {
    '1': 1,
    '2': 2,
    '3': 3,
    'ONCE': 1,
    'TWICE': 2,
    'THRICE': 3,
  };

  const frequency = FREQUENCIES[input];
  if (frequency === undefined) {
    return templates.errorMessage('Invalid frequency. Please select 1, 2, or 3.');
  }

  // Get current state
  const redis = await getRedisClient();
  const stateKey = `session:${session.id}:state`;
  const currentState = JSON.parse(await redis.get(stateKey) || '{}');

  // Store frequency
  await conversationModel.updateSessionState(session.id, { ...currentState, frequency });

  // Update step
  await conversationModel.updateSessionStep(session.id, 'AREA_SELECTED');

  // Return area prompt
  return templates.areaPrompt();
}

/**
 * Step 5: Handle area/location input
 */
async function handleAreaInput(phoneNumber, session, input) {
  const area = sanitizeInput(input);

  // Validate area (should be 1-50 characters)
  if (area.length < 2 || area.length > 50) {
    return templates.errorMessage('Please enter a valid area (2-50 characters).');
  }

  // Get current state
  const redis = await getRedisClient();
  const stateKey = `session:${session.id}:state`;
  const currentState = JSON.parse(await redis.get(stateKey) || '{}');

  // Store area
  await conversationModel.updateSessionState(session.id, { ...currentState, area });

  logger.info('Session state complete', {
    sessionId: session.id,
    state: { ...currentState, area },
  });

  // Search for matching tutors
  const tutors = await searchTutors({
    subject: currentState.subject,
    level: currentState.level,
    area,
  });

  if (!tutors || tutors.length === 0) {
    logger.info('No tutors found', {
      subject: currentState.subject,
      level: currentState.level,
      area,
    });

    // Update step to allow retry
    await conversationModel.updateSessionStep(session.id, 'AREA_SELECTED');

    return templates.noTutorsFound(area);
  }

  // Store tutors for next step
  await conversationModel.updateSessionState(session.id, {
    ...currentState,
    area,
    matching_tutors: tutors.map(t => ({
      id: t.id,
      name: t.name,
      rate: t.rate,
      experience: t.experience,
      rating: t.rating,
      specializations: t.specializations,
    })),
  });

  // Update step
  await conversationModel.updateSessionStep(session.id, 'TUTOR_DISPLAYED');

  // Return tutor options
  return templates.tutorListButtons(tutors);
}

/**
 * Step 6: Handle tutor selection
 */
async function handleTutorSelection(phoneNumber, session, input) {
  // Get current state with tutors
  const redis = await getRedisClient();
  const stateKey = `session:${session.id}:state`;
  const currentState = JSON.parse(await redis.get(stateKey) || '{}');

  // Parse tutor selection
  const tutorIndex = parseInt(input) - 1; // User sends "1", "2", etc.
  if (isNaN(tutorIndex) || !currentState.matching_tutors) {
    return templates.errorMessage('Invalid selection. Please select a tutor.');
  }

  const selectedTutor = currentState.matching_tutors[tutorIndex];
  if (!selectedTutor) {
    return templates.errorMessage('Invalid selection. Please try again.');
  }

  logger.info('Tutor selected', {
    phoneNumber,
    tutorId: selectedTutor.id,
    tutorName: selectedTutor.name,
  });

  // Update session with selected tutor
  await conversationModel.updateSessionState(session.id, {
    ...currentState,
    selected_tutor_id: selectedTutor.id,
    selected_tutor_name: selectedTutor.name,
  });

  await conversationModel.updateSessionStep(session.id, 'HANDOFF');

  // Send confirmation message
  return templates.tutorConfirmationMessage(selectedTutor);
}

/**
 * Step 7: Handoff to tutor or coordinator
 */
async function handleHandoff(phoneNumber, session, input) {
  const redis = await getRedisClient();
  const stateKey = `session:${session.id}:state`;
  const currentState = JSON.parse(await redis.get(stateKey) || '{}');

  // Mark session as completed
  await conversationModel.completeSession(session.id, currentState.selected_tutor_id);

  logger.info('Session completed - handoff successful', {
    phoneNumber,
    sessionId: session.id,
    tutorId: currentState.selected_tutor_id,
  });

  // In production, you would:
  // 1. Notify tutor via WhatsApp or email
  // 2. Create booking record
  // 3. Send follow-up message after 24 hours

  return templates.handoffConfirmation(currentState.selected_tutor_name);
}

module.exports = {
  handleIncomingMessage,
};
