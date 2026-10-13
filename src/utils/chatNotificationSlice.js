import { createSlice } from "@reduxjs/toolkit";

const chatNotificationSlice = createSlice({
  name: "chatNotifications",
  initialState: {
    unreadCount: 0,
    latestNotification: null,
  },
  reducers: {
    addNotification: (state, action) => {
      state.unreadCount += 1;
      state.latestNotification = action.payload;
    },
    clearLatestNotification: (state) => {
      state.latestNotification = null;
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0;
    },
    decrementUnreadCount: (state, action) => {
      const count = action.payload || 1;
      state.unreadCount = Math.max(0, state.unreadCount - count);
    },
  },
});

export const {
  addNotification,
  clearLatestNotification,
  resetUnreadCount,
  decrementUnreadCount,
} = chatNotificationSlice.actions;

export default chatNotificationSlice.reducer;
