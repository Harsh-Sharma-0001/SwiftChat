// src/store/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ message, sessionId }, { rejectWithValue }) => {
  try {
    const res = await api.post('/ai/chat', { message, sessionId });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Chat failed');
  }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    messages: [
      { id: '1', role: 'assistant', text: "I'm ARIA, your AI guide! Discover content by emotion or let me help you craft the perfect caption. ✨" }
    ],
    sessionId: `session_${Date.now()}`,
    isTyping: false,
    isOpen: false,
  },
  reducers: {
    toggleChat: (state) => { state.isOpen = !state.isOpen; },
    addUserMessage: (state, action) => {
      state.messages.push({ id: Date.now().toString(), role: 'user', text: action.payload });
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(sendMessage.pending, (state) => { state.isTyping = true; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        state.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          text: action.payload.data.response
        });
        if (action.payload.data.sessionId) state.sessionId = action.payload.data.sessionId;
      })
      .addCase(sendMessage.rejected, (state) => {
        state.isTyping = false;
        state.messages.push({
          id: Date.now().toString(),
          role: 'assistant',
          text: "Oops, my neural link dropped. Can you say that again?"
        });
      });
  },
});

export const { toggleChat, addUserMessage } = chatSlice.actions;
export default chatSlice.reducer;
