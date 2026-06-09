import { Router, Response } from 'express';
import { Message, Conversation } from '../models/Message';
import { authenticate, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();

// GET /api/messages/conversations
router.get('/conversations', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const conversations = await Conversation.find({
    participants: req.user!._id,
  })
    .sort({ lastMessageAt: -1 })
    .populate('participants', 'firstName lastName profilePicture grade lastSeen')
    .populate('lastMessage')
    .lean();

  res.json({ conversations });
});

// GET or POST /api/messages/conversation/:userId
router.get('/conversation/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const currentUserId = req.user!._id;
  const otherUserId = new mongoose.Types.ObjectId(req.params.userId);

  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId], $size: 2 },
  });

  if (!conversation) {
    conversation = new Conversation({
      participants: [currentUserId, otherUserId],
    });
    await conversation.save();
  }

  await conversation.populate('participants', 'firstName lastName profilePicture grade lastSeen');

  const page = parseInt(req.query.page as string) || 1;
  const limit = 30;
  const skip = (page - 1) * limit;

  const messages = await Message.find({
    conversation: conversation._id,
    isDeleted: false,
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'firstName lastName profilePicture')
    .lean();

  // Mark messages as read
  await Message.updateMany(
    {
      conversation: conversation._id,
      sender: { $ne: currentUserId },
      readBy: { $ne: currentUserId },
    },
    { $addToSet: { readBy: currentUserId } }
  );

  res.json({
    conversation,
    messages: messages.reverse(),
    hasMore: messages.length === limit,
  });
});

// POST /api/messages/send
router.post('/send', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { recipientId, content, mediaUrl, mediaType } = req.body;

  if (!recipientId || (!content && !mediaUrl)) {
    res.status(400).json({ message: 'Recipient and content required' });
    return;
  }

  const currentUserId = req.user!._id;
  const otherUserId = new mongoose.Types.ObjectId(recipientId);

  let conversation = await Conversation.findOne({
    participants: { $all: [currentUserId, otherUserId], $size: 2 },
  });

  if (!conversation) {
    conversation = new Conversation({
      participants: [currentUserId, otherUserId],
    });
  }

  const message = new Message({
    conversation: conversation._id,
    sender: currentUserId,
    content,
    mediaUrl,
    mediaType,
    readBy: [currentUserId],
  });

  await message.save();
  await message.populate('sender', 'firstName lastName profilePicture');

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // Emit via socket
  const io = req.app.get('io');
  io.to(`user_${recipientId}`).emit('new_message', {
    message,
    conversationId: conversation._id,
  });

  res.status(201).json({ message });
});

// GET /api/messages/unread-count
router.get('/unread-count', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const conversations = await Conversation.find({
    participants: req.user!._id,
  }).select('_id');

  const conversationIds = conversations.map(c => c._id);

  const count = await Message.countDocuments({
    conversation: { $in: conversationIds },
    sender: { $ne: req.user!._id },
    readBy: { $ne: req.user!._id },
    isDeleted: false,
  });

  res.json({ count });
});

export default router;
