import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getDefaultApiState, handleApiState } from "./helper";
import { callAPI } from "../services/callApi";

const initialState = {
  getDashboardStatsApi: getDefaultApiState(),
};

export const getDashboardStats = createAsyncThunk(
  "dashboard/getStats",
  async () => {
    const res = await callAPI("/dashboard/stats", {
      method: "GET",
    });
    return res.data;
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    handleApiState(builder, getDashboardStats, "getDashboardStatsApi");
  },
});

export default dashboardSlice.reducer;
