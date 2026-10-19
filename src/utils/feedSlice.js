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
    // Prepend a brand-new user to the top of the feed (real-time newUserJoined)
    prependToFeed: (state, action) => {
      const newUser = action.payload;
      if (!newUser) return state;
      if (!state) return [newUser];
      // Skip if already in the feed (dedup by _id)
      const alreadyExists = state.some((u) => String(u._id) === String(newUser._id));
      if (alreadyExists) return state;
      return [newUser, ...state];
    },
    clearFeed: () => {
      return null;
    },
  },
});

export const { addFeed, removeUserFromFeed, restoreUserToFeed, prependToFeed, clearFeed } =
  feedSlice.actions;

export default feedSlice.reducer;


