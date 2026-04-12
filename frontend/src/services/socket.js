// src/services/socket.js — Socket.io client singleton
import { io } from 'socket.io-client';
import store from '../store/store';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost';

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: false,
    });
  }
  return socket;
}

export function connectSocket() {
  const token = localStorage.getItem('token');
  if (!token) return;

  const s = getSocket();
  if (!s.connected) {
    // Update auth token in case it was refreshed
    s.auth = { token };
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) {
    socket.disconnect();
    socket = null;
  }
}
