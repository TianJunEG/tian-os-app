/**
 * Twilio Service
 * Handles all Twilio WhatsApp API interactions
 */

const twilio = require('twilio');
const logger = require('../utils/logger');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// Initialize Twilio client
const client = twilio(accountSid, authToken);

/**
 * Send a simple text message via WhatsApp
 */
async function sendTextMessage(toNumber, messageBody) {
  try {
    const message = await client.messages.create({
      from: twilioNumber,
      to: toNumber,
      body: messageBody,
    });

    logger.info('Text message sent', {
      messageId: message.sid,
      to: toNumber,
      status: message.status,
    });

    return message;
  } catch (error) {
    logger.error('Failed to send text message', {
      error: error.message,
      to: toNumber,
    });
    throw error;
  }
}

/**
 * Send a message with interactive buttons (quick replies)
 */
async function sendButtonMessage(toNumber, bodyText, buttons) {
  try {
    const message = await client.messages.create({
      from: twilioNumber,
      to: toNumber,
      contentVariables: JSON.stringify({
        body: bodyText,
        buttons: buttons,
      }),
      contentSid: process.env.TWILIO_CONTENT_SID, // Pre-approved message template
    });

    logger.info('Button message sent', {
      messageId: message.sid,
      to: toNumber,
      buttonCount: buttons.length,
    });

    return message;
  } catch (error) {
    logger.error('Failed to send button message', {
      error: error.message,
      to: toNumber,
    });

    // Fallback: send as text if template fails
    return sendTextMessage(toNumber, bodyText);
  }
}

/**
 * Send a list message (selection from multiple options)
 */
async function sendListMessage(toNumber, bodyText, items) {
  try {
    const message = await client.messages.create({
      from: twilioNumber,
      to: toNumber,
      contentVariables: JSON.stringify({
        body: bodyText,
        items: items,
      }),
      contentSid: process.env.TWILIO_CONTENT_SID,
    });

    logger.info('List message sent', {
      messageId: message.sid,
      to: toNumber,
      itemCount: items.length,
    });

    return message;
  } catch (error) {
    logger.error('Failed to send list message', {
      error: error.message,
      to: toNumber,
    });

    // Fallback: send as text
    const textBody = items.map((item, idx) => `${idx + 1}. ${item.title}`).join('\n');
    return sendTextMessage(toNumber, `${bodyText}\n\n${textBody}`);
  }
}

/**
 * Generic send message function that handles different message types
 */
async function sendWhatsAppMessage(toNumber, messageObject) {
  try {
    if (!messageObject) {
      logger.warn('Empty message object', { to: toNumber });
      return null;
    }

    let result;

    switch (messageObject.type) {
      case 'text':
        result = await sendTextMessage(toNumber, messageObject.body);
        break;

      case 'buttons':
        result = await sendButtonMessage(
          toNumber,
          messageObject.body,
          messageObject.buttons
        );
        break;

      case 'list':
        result = await sendListMessage(toNumber, messageObject.body, messageObject.items);
        break;

      default:
        logger.warn('Unknown message type', {
          type: messageObject.type,
          to: toNumber,
        });
        result = await sendTextMessage(toNumber, messageObject.body);
    }

    return result;
  } catch (error) {
    logger.error('Failed to send WhatsApp message', {
      error: error.message,
      to: toNumber,
      messageType: messageObject?.type,
    });
    throw error;
  }
}

/**
 * Get message status
 */
async function getMessageStatus(messageSid) {
  try {
    const message = await client.messages(messageSid).fetch();
    return {
      sid: message.sid,
      status: message.status,
      to: message.to,
      from: message.from,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
    };
  } catch (error) {
    logger.error('Failed to get message status', {
      error: error.message,
      messageSid,
    });
    throw error;
  }
}

/**
 * Send a template message (pre-approved by WhatsApp)
 */
async function sendTemplateMessage(toNumber, templateSid, templateVariables = {}) {
  try {
    const message = await client.messages.create({
      from: twilioNumber,
      to: toNumber,
      contentSid: templateSid,
      contentVariables: JSON.stringify(Object.values(templateVariables)),
    });

    logger.info('Template message sent', {
      messageId: message.sid,
      to: toNumber,
      templateSid,
    });

    return message;
  } catch (error) {
    logger.error('Failed to send template message', {
      error: error.message,
      to: toNumber,
      templateSid,
    });
    throw error;
  }
}

module.exports = {
  sendWhatsAppMessage,
  sendTextMessage,
  sendButtonMessage,
  sendListMessage,
  sendTemplateMessage,
  getMessageStatus,
  client,
};
