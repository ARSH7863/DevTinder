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
    clearFeed: () => {
      return null;
    },
  },
});

export const { addFeed, removeUserFromFeed, clearFeed } = feedSlice.actions;

export default feedSlice.reducer;
