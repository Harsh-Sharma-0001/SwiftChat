// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    isSidebarOpen: true,
    isRightPanelOpen: true,
    activeEmotion: null,
  },
  reducers: {
    toggleSidebar: (state) => { state.isSidebarOpen = !state.isSidebarOpen; },
    toggleRightPanel: (state) => { state.isRightPanelOpen = !state.isRightPanelOpen; },
    setEmotionPulse: (state, action) => { state.activeEmotion = action.payload; },
  },
});

export const { toggleSidebar, toggleRightPanel, setEmotionPulse } = uiSlice.actions;
export default uiSlice.reducer;
