// src/store/slices/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const sendMessage = createAsyncThunk('chat/sendMessage', async ({ message, sessionId, extraContext = {} }, { getState, rejectWithValue }) => {
  try {
    const { auth } = getState();
    const user = auth.user;
    
    // Core identity grounding context
    const context = {
      displayName: user?.displayName || user?.username || 'User',
      username: user?.username,
      email: user?.email,
      bio: user?.bio,
      currentPath: window.location.pathname,
      ...extraContext
    };

    const res = await api.post('/ai/chat', { message, sessionId, context });
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
    aiSuggestion: null,
  },
  reducers: {
    toggleChat: (state, action) => { 
      state.isOpen = action.payload !== undefined ? action.payload : !state.isOpen; 
    },
    setAiSuggestion: (state, action) => {
      state.aiSuggestion = action.payload;
    },
    addUserMessage: (state, action) => {
      state.messages.push({ id: Date.now().toString(), role: 'user', text: action.payload });
      state.aiSuggestion = null; // Clear suggestion once used
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

export const { toggleChat, addUserMessage, setAiSuggestion } = chatSlice.actions;
export default chatSlice.reducer;
