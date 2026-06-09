import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export interface AuthRequest extends Request {
  user?: IUser;
  isAdmin?: boolean;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ message: 'Your account has been suspended', reason: user.banReason });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: 'Please verify your email first' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
};

// Temporary admin mode via secret code (no user account needed)
export const adminSecretAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const adminToken = req.headers['x-admin-token'];
  
  if (adminToken !== process.env.ADMIN_SECRET_TOKEN) {
    res.status(403).json({ message: 'Invalid admin token' });
    return;
  }
  
  req.isAdmin = true;
  next();
};
