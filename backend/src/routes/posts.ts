import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/Post';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();

// GET /api/posts/feed
router.get('/feed', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const gradeFilter = req.query.grade as string;
  const skip = (page - 1) * limit;

  let query: any = { isDeleted: false };

  if (gradeFilter) {
    query.$or = [
      { visibility: 'all' },
      { visibility: 'grade', targetGrade: gradeFilter },
      { visibility: 'year', targetGrade: { $regex: `^${gradeFilter.charAt(0)}` } },
    ];
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'firstName lastName profilePicture grade')
    .populate('comments.author', 'firstName lastName profilePicture')
    .populate('sharedFrom', 'content author mediaUrl mediaType')
    .lean();

  const total = await Post.countDocuments(query);

  res.json({
    posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });
});

// POST /api/posts
router.post('/', authenticate, [
  body('content').optional().isLength({ max: 2000 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const { content, mediaUrl, mediaType, mediaThumbnail, visibility, targetGrade } = req.body;

  if (!content && !mediaUrl) {
    res.status(400).json({ message: 'Post must have content or media' });
    return;
  }

  const post = new Post({
    author: req.user!._id,
    content: content || '',
    mediaUrl,
    mediaType,
    mediaThumbnail,
    visibility: visibility || 'all',
    targetGrade,
  });

  await post.save();
  await post.populate('author', 'firstName lastName profilePicture grade');

  // Emit to socket
  const io = req.app.get('io');
  io.emit('new_post', post);

  res.status(201).json({ post });
});

// POST /api/posts/:id/like
router.post('/:id/like', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id);
  if (!post || post.isDeleted) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  const userId = req.user!._id;
  const liked = post.likes.some(id => id.equals(userId));

  if (liked) {
    post.likes = post.likes.filter(id => !id.equals(userId));
  } else {
    post.likes.push(userId);
  }

  await post.save();
  res.json({ liked: !liked, likesCount: post.likes.length });
});

// POST /api/posts/:id/comment
router.post('/:id/comment', authenticate, [
  body('content').notEmpty().isLength({ max: 500 }),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id);
  if (!post || post.isDeleted) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  const comment = {
    _id: new mongoose.Types.ObjectId(),
    author: req.user!._id,
    content: req.body.content,
    likes: [],
    createdAt: new Date(),
  };

  post.comments.push(comment as any);
  await post.save();
  await post.populate('comments.author', 'firstName lastName profilePicture');

  const newComment = post.comments[post.comments.length - 1];
  res.status(201).json({ comment: newComment });
});

// DELETE /api/posts/:id/comment/:commentId
router.delete('/:id/comment/:commentId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  const comment = post.comments.id(req.params.commentId);
  if (!comment) {
    res.status(404).json({ message: 'Comment not found' });
    return;
  }

  // Only author or admin can delete
  if (!comment.author.equals(req.user!._id) && req.user!.role !== 'admin') {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  comment.deleteOne();
  await post.save();
  res.json({ message: 'Comment deleted' });
});

// POST /api/posts/:id/share
router.post('/:id/share', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const originalPost = await Post.findById(req.params.id);
  if (!originalPost || originalPost.isDeleted) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  const userId = req.user!._id;
  if (!originalPost.shares.some(id => id.equals(userId))) {
    originalPost.shares.push(userId);
    await originalPost.save();
  }

  const sharedPost = new Post({
    author: userId,
    content: req.body.content || '',
    sharedFrom: originalPost._id,
    visibility: 'all',
  });

  await sharedPost.save();
  await sharedPost.populate('author', 'firstName lastName profilePicture grade');
  await sharedPost.populate('sharedFrom');

  res.status(201).json({ post: sharedPost });
});

// DELETE /api/posts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  if (!post.author.equals(req.user!._id) && req.user!.role !== 'admin') {
    res.status(403).json({ message: 'Not authorized' });
    return;
  }

  post.isDeleted = true;
  post.deletedBy = req.user!._id;
  post.deletedAt = new Date();
  await post.save();

  res.json({ message: 'Post deleted' });
});

// GET /api/posts/user/:userId
router.get('/user/:userId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 12;
  const skip = (page - 1) * limit;

  const posts = await Post.find({ author: req.params.userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'firstName lastName profilePicture grade')
    .lean();

  const total = await Post.countDocuments({ author: req.params.userId, isDeleted: false });

  res.json({
    posts,
    pagination: { page, limit, total, hasMore: page * limit < total },
  });
});

export default router;
