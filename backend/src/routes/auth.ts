import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User';
import { verifyEmailDomain, sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const ALLOWED_GRADES = [
  'ט1','ט2','ט3','ט4','ט5','ט6','ט7','ט8',
  'י1','י2','י3','י4','י5','י6','י7','י8',
  'יא1','יא2','יא3','יא4','יא5','יא6','יא7','יא8',
  'יב1','יב2','יב3','יב4','יב5','יב6','יב7','יב8',
];

// Parse name from email: firstname.lastname@edu-darom.org.il
const parseNameFromEmail = (email: string): { firstName: string; lastName: string } => {
  const localPart = email.split('@')[0];
  const parts = localPart.split('.');
  
  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  
  if (parts.length >= 2) {
    return {
      firstName: capitalize(parts[0]),
      lastName: capitalize(parts.slice(1).join(' ')),
    };
  }
  
  return {
    firstName: capitalize(localPart),
    lastName: '',
  };
};

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('grade').isIn(ALLOWED_GRADES).withMessage('Invalid grade'),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password, grade } = req.body;

  try {
    // Validate domain
    const isValidDomain = await verifyEmailDomain(email);
    if (!isValidDomain) {
      res.status(400).json({ 
        message: 'רק כתובות מייל של edu-darom.org.il מותרות / Only edu-darom.org.il emails are allowed' 
      });
      return;
    }

    // Check existing
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    // Parse name from email
    const { firstName, lastName } = parseNameFromEmail(email);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = new User({
      email,
      password,
      firstName,
      lastName,
      grade,
      verificationToken,
      verificationTokenExpiry,
      isVerified: false,
    });

    await user.save();

    // Send verification email
    try {
      await sendVerificationEmail(email, firstName, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail registration if email fails
    }

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      firstName,
      lastName,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }
    throw error;
  }
});

// GET /api/auth/verify?token=...
router.get('/verify', async (req: Request, res: Response): Promise<void> => {
  const { token } = req.query;

  if (!token) {
    res.status(400).json({ message: 'Verification token required' });
    return;
  }

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({ message: 'Invalid or expired verification token' });
    return;
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  // Generate JWT
  const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

  res.json({
    message: 'Email verified successfully',
    token: jwtToken,
    user: user.toJSON(),
  });
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ 
      message: `החשבון שלך הושעה: ${user.banReason || 'הפרת כללי הקהילה'}` 
    });
    return;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    res.status(401).json({ message: 'Invalid email or password' });
    return;
  }

  if (!user.isVerified) {
    res.status(403).json({ message: 'Please verify your email first' });
    return;
  }

  // Update last seen
  user.lastSeen = new Date();
  await user.save();

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: '30d' });

  res.json({
    token,
    user: user.toJSON(),
  });
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ user: req.user!.toJSON() });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond success to prevent email enumeration
  if (!user || !user.isVerified) {
    res.json({ message: 'If that email exists, we sent a reset link' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.verificationToken = token;
  user.verificationTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await user.save();

  try {
    await sendPasswordResetEmail(email, user.firstName, token);
  } catch (e) {
    console.error('Failed to send reset email:', e);
  }

  res.json({ message: 'If that email exists, we sent a reset link' });
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }),
], async (req: Request, res: Response): Promise<void> => {
  const { token, password } = req.body;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: new Date() },
  });

  if (!user) {
    res.status(400).json({ message: 'Invalid or expired reset token' });
    return;
  }

  user.password = password;
  user.verificationToken = undefined;
  user.verificationTokenExpiry = undefined;
  await user.save();

  res.json({ message: 'Password reset successfully' });
});

// POST /api/auth/resend-verification
router.post('/resend-verification', [
  body('email').isEmail().normalizeEmail(),
], async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const user = await User.findOne({ email, isVerified: false });

  if (!user) {
    res.json({ message: 'Verification email sent if account exists' });
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.verificationToken = token;
  user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  try {
    await sendVerificationEmail(email, user.firstName, token);
  } catch (e) {
    console.error(e);
  }

  res.json({ message: 'Verification email sent' });
});

export default router;
