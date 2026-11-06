import { Server as SocketIOServer, Socket } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { env } from './config/env.js';
import { prisma } from './config/db.js';

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    role: string;
    schoolId: string;
  };
}

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 10000,
  });

  // Authentication Middleware for WebSocket Connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (socket.handshake.query?.token as string);

      if (!token) {
        return next(new Error('Authentication required for real-time messaging'));
      }

      const decoded = jwt.verify(token, env.jwtAccessSecret) as any;
      if (!decoded || !decoded.userId) {
        return next(new Error('Invalid token payload'));
      }

      socket.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        schoolId: decoded.schoolId,
      };

      next();
    } catch (err: any) {
      next(new Error('Authentication failed: ' + (err.message || 'Unauthorized')));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) return;

    // Join personal room and school tenant room
    socket.join(`user:${user.userId}`);
    if (user.schoolId) {
      socket.join(`school:${user.schoolId}`);
    }

    // Join conversation room after validating authorization in PostgreSQL
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      try {
        if (!data?.conversationId) return;

        // Verify conversation membership
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: data.conversationId,
            userId: user.userId,
          },
        });

        // Or allow School Admin / Super Admin for monitoring
        if (participant || user.role === 'SUPER_ADMIN' || user.role === 'SCHOOL_ADMIN') {
          socket.join(`conversation:${data.conversationId}`);
          socket.emit('joined_conversation', { conversationId: data.conversationId });
        } else {
          socket.emit('error', { message: 'Unauthorized conversation room' });
        }
      } catch (err) {
        console.error('Socket join_conversation error:', err);
      }
    });

    socket.on('leave_conversation', (data: { conversationId: string }) => {
      if (data?.conversationId) {
        socket.leave(`conversation:${data.conversationId}`);
      }
    });

    // Real-time typing indicators
    socket.on('typing_start', (data: { conversationId: string }) => {
      if (data?.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
          conversationId: data.conversationId,
          userId: user.userId,
          isTyping: true,
        });
      }
    });

    socket.on('typing_stop', (data: { conversationId: string }) => {
      if (data?.conversationId) {
        socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
          conversationId: data.conversationId,
          userId: user.userId,
          isTyping: false,
        });
      }
    });

    // Real-time read receipt updates
    socket.on('mark_as_read', async (data: { conversationId: string; messageId: string }) => {
      try {
        if (!data?.conversationId || !data?.messageId) return;

        await prisma.conversationParticipant.updateMany({
          where: { conversationId: data.conversationId, userId: user.userId },
          data: { lastReadMessageId: data.messageId, lastReadAt: new Date() },
        });

        await prisma.chatMessageReceipt.upsert({
          where: {
            messageId_userId: {
              messageId: data.messageId,
              userId: user.userId,
            },
          },
          create: {
            messageId: data.messageId,
            userId: user.userId,
            status: 'READ',
            readAt: new Date(),
          },
          update: {
            status: 'READ',
            readAt: new Date(),
          },
        });

        io?.to(`conversation:${data.conversationId}`).emit('read_receipt', {
          conversationId: data.conversationId,
          messageId: data.messageId,
          userId: user.userId,
          readAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Socket mark_as_read error:', err);
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getSocketIO(): SocketIOServer | null {
  return io;
}

export function broadcastNewMessage(conversationId: string, messagePayload: any) {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit('new_message', messagePayload);
}

export function notifyUserNewMessage(userId: string, conversationSummary: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit('conversation_updated', conversationSummary);
}

export function broadcastMeetingUpdate(schoolId: string, meetingPayload: any) {
  if (!io) return;
  io.to(`school:${schoolId}`).emit('meeting_updated', meetingPayload);
}
