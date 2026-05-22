/**
 * WhatsApp Webhook Routes
 * Handles incoming messages and status updates from Twilio
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const chatbotController = require('../controllers/chatbot');
const { verifyTwilioRequest } = require('../utils/validators');

/**
 * POST /webhook/message
 * Receives incoming WhatsApp messages from Twilio
 */
router.post('/message', verifyTwilioRequest, async (req, res) => {
  try {
    const { From, Body, MessageSid, ProfileName } = req.body;

    logger.info('Incoming WhatsApp message', {
      from: From,
      messageId: MessageSid,
      senderName: ProfileName,
      body: Body.substring(0, 50), // Log first 50 chars
    });

    // Process the message through chatbot
    const response = await chatbotController.handleIncomingMessage({
      phoneNumber: From,
      message: Body,
      messageId: MessageSid,
      senderName: ProfileName,
    });

    // Send response back to user
    if (response) {
      logger.info('Sending response', {
        to: From,
        messageType: response.type,
      });
    }

    // Return 200 OK to Twilio (even if no response is sent)
    res.status(200).send();
  } catch (error) {
    logger.error('Error processing webhook message', {
      error: error.message,
      stack: error.stack,
    });
    // Still return 200 to prevent Twilio from retrying
    res.status(200).send();
  }
});

/**
 * POST /webhook/status
 * Receives message delivery status updates from Twilio
 */
router.post('/status', verifyTwilioRequest, async (req, res) => {
  try {
    const { MessageSid, MessageStatus, From } = req.body;

    logger.info('Message status update', {
      messageId: MessageSid,
      status: MessageStatus,
      from: From,
    });

    // Could log status to database for analytics
    res.status(200).send();
  } catch (error) {
    logger.error('Error processing status webhook', {
      error: error.message,
    });
    res.status(200).send();
  }
});

/**
 * GET /webhook/message
 * Webhook validation endpoint for Twilio
 */
router.get('/message', (req, res) => {
  // Twilio sends a GET request to validate the webhook URL
  res.status(200).send();
});

module.exports = router;
