import { createSlice } from "@reduxjs/toolkit";

const requestSlice = createSlice({
  name: "requests",
  initialState: null,
  reducers: {
    addRequests: (state, action) => {
      return action.payload;
    },
    removeRequest: (state, action) => {
      if (!state) return null;
      return state.filter((req) => req._id !== action.payload);
    },
    clearRequests: () => {
      return null;
    },
  },
});

export const { addRequests, removeRequest, clearRequests } =
  requestSlice.actions;

export default requestSlice.reducer;
