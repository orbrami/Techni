import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users/search
router.get('/search', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const q = req.query.q as string;
  if (!q || q.length < 2) {
    res.json({ users: [] });
    return;
  }

  const users = await User.find({
    $or: [
      { firstName: { $regex: q, $options: 'i' } },
      { lastName: { $regex: q, $options: 'i' } },
    ],
    isVerified: true,
    isBanned: false,
    _id: { $ne: req.user!._id },
  })
    .select('firstName lastName profilePicture grade')
    .limit(10)
    .lean();

  res.json({ users });
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await User.findById(req.params.id)
    .select('-password -verificationToken -verificationTokenExpiry')
    .lean();

  if (!user) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  res.json({ user });
});

// PATCH /api/users/me/profile
router.patch('/me/profile', authenticate, [
  body('bio').optional().isLength({ max: 160 }),
  body('profilePicture').optional().isURL(),
  body('language').optional().isIn(['he', 'ru']),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { bio, profilePicture, language } = req.body;
  const user = req.user!;

  if (bio !== undefined) user.bio = bio;
  if (profilePicture !== undefined) user.profilePicture = profilePicture;
  if (language !== undefined) user.language = language;

  await user.save();
  res.json({ user: user.toJSON() });
});

// PATCH /api/users/me/grade
router.patch('/me/grade', authenticate, [
  body('grade').notEmpty(),
], async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!;

  if (user.gradeChangesLeft <= 0) {
    res.status(400).json({ 
      message: 'כבר שינית כיתה 4 פעמים. לא ניתן לשנות יותר. / You have used all 4 grade changes.' 
    });
    return;
  }

  const ALLOWED_GRADES = [
    'ט1','ט2','ט3','ט4','ט5','ט6','ט7','ט8',
    'י1','י2','י3','י4','י5','י6','י7','י8',
    'יא1','יא2','יא3','יא4','יא5','יא6','יא7','יא8',
    'יב1','יב2','יב3','יב4','יב5','יב6','יב7','יב8',
  ];

  if (!ALLOWED_GRADES.includes(req.body.grade)) {
    res.status(400).json({ message: 'Invalid grade' });
    return;
  }

  user.grade = req.body.grade;
  user.gradeChangesLeft -= 1;
  await user.save();

  res.json({ 
    user: user.toJSON(),
    gradeChangesLeft: user.gradeChangesLeft,
  });
});

// POST /api/users/:id/follow
router.post('/:id/follow', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.params.id === req.user!._id.toString()) {
    res.status(400).json({ message: 'Cannot follow yourself' });
    return;
  }

  const targetUser = await User.findById(req.params.id);
  if (!targetUser) {
    res.status(404).json({ message: 'User not found' });
    return;
  }

  const currentUser = req.user!;
  const isFollowing = currentUser.following.some(id => id.equals(targetUser._id));

  if (isFollowing) {
    currentUser.following = currentUser.following.filter(id => !id.equals(targetUser._id));
    targetUser.followers = targetUser.followers.filter(id => !id.equals(currentUser._id));
  } else {
    currentUser.following.push(targetUser._id);
    targetUser.followers.push(currentUser._id);
  }

  await currentUser.save();
  await targetUser.save();

  res.json({
    following: !isFollowing,
    followersCount: targetUser.followers.length,
  });
});

export default router;
