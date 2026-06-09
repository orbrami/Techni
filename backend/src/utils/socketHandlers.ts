import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/User';

interface AuthSocket extends Socket {
  userId?: string;
}

export const setupSocketHandlers = (io: Server): void => {
  // Authenticate socket connections
  io.use(async (socket: AuthSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.userId = decoded.userId;
        
        // Update last seen
        await User.findByIdAndUpdate(decoded.userId, { lastSeen: new Date() });
      }
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthSocket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.userId})`);

    if (socket.userId) {
      // Join personal room for private messages
      socket.join(`user_${socket.userId}`);
      
      // Broadcast online status
      socket.broadcast.emit('user_online', { userId: socket.userId });
    }

    // Join conversation room
    socket.on('join_conversation', (conversationId: string) => {
      socket.join(`conv_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId: string) => {
      socket.leave(`conv_${conversationId}`);
    });

    // Typing indicators
    socket.on('typing_start', ({ conversationId, recipientId }: { conversationId: string; recipientId: string }) => {
      socket.to(`user_${recipientId}`).emit('typing_start', {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on('typing_stop', ({ conversationId, recipientId }: { conversationId: string; recipientId: string }) => {
      socket.to(`user_${recipientId}`).emit('typing_stop', {
        conversationId,
        userId: socket.userId,
      });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        socket.broadcast.emit('user_offline', { userId: socket.userId });
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
