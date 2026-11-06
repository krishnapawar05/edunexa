import { io, Socket } from 'socket.io-client';
import { getStoredAuthToken } from './api.js';

let socket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!socket) {
    const token = getStoredAuthToken();
    const serverUrl = window.location.origin;

    socket = io(serverUrl, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect_error', (err) => {
      console.warn('Real-time messaging connection notice:', err.message);
    });
  }

  return socket;
}

export const connectSocket = getChatSocket;
export const getSocket = getChatSocket;

export function joinConversationRoom(conversationId: string) {
  const s = getChatSocket();
  s.emit('join_conversation', { conversationId });
}

export function leaveConversationRoom(conversationId: string) {
  const s = getChatSocket();
  s.emit('leave_conversation', { conversationId });
}

export function emitTypingStatus(conversationId: string, isTyping: boolean) {
  const s = getChatSocket();
  s.emit(isTyping ? 'typing_start' : 'typing_stop', { conversationId });
}

export function emitMarkAsRead(conversationId: string, messageId: string) {
  const s = getChatSocket();
  s.emit('mark_as_read', { conversationId, messageId });
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
