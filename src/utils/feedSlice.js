import { createSlice } from "@reduxjs/toolkit";

const feedSlice = createSlice({
  name: "feed",
  initialState: null,
  reducers: {
    addFeed: (state, action) => {
      return action.payload;
    },
    removeUserFromFeed: (state, action) => {
      // Remove the first user (the one being swiped on)
      const newFeed = state?.filter((user) => user._id !== action.payload);
      return newFeed;
    },
    restoreUserToFeed: (state, action) => {
      const restoredUser = action.payload;
      if (!restoredUser) return state;
      if (!state) return [restoredUser];
      // Prevent duplicate if user is somehow still in state
      const filtered = state.filter((user) => user._id !== restoredUser._id);
      return [restoredUser, ...filtered];
    },
    clearFeed: () => {
      return null;
    },
  },
});

export const { addFeed, removeUserFromFeed, restoreUserToFeed, clearFeed } =
  feedSlice.actions;

export default feedSlice.reducer;
