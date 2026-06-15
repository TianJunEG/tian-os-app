import express from 'express';
import { body, validationResult } from 'express-validator';
import { Message, Conversation } from '../models/Message.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// @route   POST /api/messages/conversations
// @desc    Create or get conversation between two users
// @access  Private
router.post(
  '/conversations',
  protect,
  [
    body('recipientId', 'Recipient ID is required').notEmpty()
  ],
  async (req, res) => {
    try {
      const { recipientId } = req.body;
      const userId = req.user.id;

      if (userId === recipientId) {
        return res.status(400).json({ error: 'Cannot chat with yourself' });
      }

      // Find existing conversation or create new one
      let conversation = await Conversation.findOne({
        participantIds: {
          $all: [userId, recipientId]
        }
      });

      if (!conversation) {
        conversation = new Conversation({
          participantIds: [userId, recipientId]
        });
        await conversation.save();
      }

      res.json({ success: true, conversation });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   GET /api/messages/conversations
// @desc    Get all conversations for user
// @access  Private
router.get('/conversations', protect, asyncHandler(async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participantIds: req.user.id
    })
      .populate('participantIds', 'name email avatar')
      .populate('lastMessage')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// @route   GET /api/messages/:conversationId
// @desc    Get messages in a conversation
// @access  Private
router.get('/:conversationId', protect, asyncHandler(async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation.participantIds.includes(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to view this conversation' });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'name email avatar')
      .populate('recipientId', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        recipientId: req.user.id,
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      count: messages.length,
      messages: messages.reverse()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post(
  '/',
  protect,
  [
    body('conversationId', 'Conversation ID is required').notEmpty(),
    body('recipientId', 'Recipient ID is required').notEmpty(),
    body('content', 'Message content is required and cannot be empty').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { conversationId, recipientId, content } = req.body;
      const senderId = req.user.id;

      // Verify conversation exists and user is a participant
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      if (!conversation.participantIds.includes(senderId)) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      // Create message
      const message = new Message({
        conversationId,
        senderId,
        recipientId,
        content
      });

      await message.save();

      // Update conversation
      conversation.lastMessage = message._id;
      conversation.lastMessageAt = new Date();
      await conversation.save();

      await message.populate('senderId', 'name email avatar');
      await message.populate('recipientId', 'name email avatar');

      res.status(201).json({ success: true, message });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   PUT /api/messages/:messageId
// @desc    Edit a message
// @access  Private
router.put(
  '/:messageId',
  protect,
  [
    body('content', 'Message content is required').trim().notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let message = await Message.findById(req.params.messageId);

      if (!message) {
        return res.status(404).json({ error: 'Message not found' });
      }

      if (message.senderId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      message.content = req.body.content;
      message.updatedAt = new Date();
      await message.save();

      res.json({ success: true, message });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// @route   DELETE /api/messages/:messageId
// @desc    Delete a message
// @access  Private
router.delete('/:messageId', protect, asyncHandler(async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await Message.deleteOne({ _id: req.params.messageId });

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

export default router;
