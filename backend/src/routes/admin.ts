import { Router, Request, Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import { authenticate, adminSecretAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require either admin role or secret token
const adminAuth = async (req: AuthRequest, res: Response, next: Function): Promise<void> => {
  const secretToken = req.headers['x-admin-token'];

  if (secretToken === process.env.ADMIN_SECRET_TOKEN) {
    req.isAdmin = true;
    return next();
  }

  // Fall back to authenticated user with admin role
  return authenticate(req, res, async () => {
    if (req.user?.role === 'admin') {
      req.isAdmin = true;
      return next();
    }
    res.status(403).json({ message: 'Admin access required' });
  });
};

// POST /api/admin/verify-code
router.post('/verify-code', (req: Request, res: Response): void => {
  const { code } = req.body;
  const ADMIN_CODE = process.env.ADMIN_CODE || '1324';

  if (code !== ADMIN_CODE) {
    res.status(401).json({ message: 'Invalid admin code' });
    return;
  }

  // Return a temporary session token
  const token = process.env.ADMIN_SECRET_TOKEN || 'admin-secret-change-me';
  res.json({ adminToken: token, message: 'Admin mode activated' });
});

// GET /api/admin/users
router.get('/users', adminAuth as any, async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;
  const search = req.query.search as string;

  let query: any = {};
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(query)
    .select('-password -verificationToken')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await User.countDocuments(query);

  res.json({ users, total, pages: Math.ceil(total / limit) });
});

// POST /api/admin/users/:id/ban
router.post('/users/:id/ban', adminAuth as any, async (req: AuthRequest, res: Response): Promise<void> => {
  const { reason } = req.body;
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  user.isBanned = true;
  user.banReason = reason || 'הפרת כללי הקהילה';
  await user.save();

  res.json({ message: 'User banned', user: user.toJSON() });
});

// POST /api/admin/users/:id/unban
router.post('/users/:id/unban', adminAuth as any, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  user.isBanned = false;
  user.banReason = undefined;
  await user.save();

  res.json({ message: 'User unbanned', user: user.toJSON() });
});

// DELETE /api/admin/posts/:id
router.delete('/posts/:id', adminAuth as any, async (req: AuthRequest, res: Response): Promise<void> => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404).json({ message: 'Post not found' });
    return;
  }

  post.isDeleted = true;
  post.deletedAt = new Date();
  await post.save();

  res.json({ message: 'Post deleted by admin' });
});

// GET /api/admin/posts
router.get('/posts', adminAuth as any, async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = 20;
  const skip = (page - 1) * limit;

  const posts = await Post.find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'firstName lastName email grade')
    .lean();

  const total = await Post.countDocuments({ isDeleted: false });

  res.json({ posts, total, pages: Math.ceil(total / limit) });
});

// GET /api/admin/stats
router.get('/stats', adminAuth as any, async (req: AuthRequest, res: Response): Promise<void> => {
  const [totalUsers, verifiedUsers, bannedUsers, totalPosts] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isVerified: true }),
    User.countDocuments({ isBanned: true }),
    Post.countDocuments({ isDeleted: false }),
  ]);

  // Users by grade
  const usersByGrade = await User.aggregate([
    { $match: { isVerified: true } },
    { $group: { _id: '$grade', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Recent registrations (last 7 days)
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });

  res.json({
    totalUsers,
    verifiedUsers,
    bannedUsers,
    totalPosts,
    recentUsers,
    usersByGrade,
  });
});

// POST /api/admin/users/:id/make-admin
router.post('/users/:id/make-admin', adminAuth as any, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }
  user.role = 'admin';
  await user.save();
  res.json({ message: 'User promoted to admin' });
});

export default router;
