import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getDefaultApiState, handleApiState } from "./helper";
import { callAPI } from "../services/callApi";

const initialState = {
  getGameActivationsApi: getDefaultApiState(),
  createGameActivationApi: getDefaultApiState(),
  getGameActivationDropdownApi: getDefaultApiState(),
};

// thunk to fetch game info
export const getGameActivations = createAsyncThunk(
  `gameActivations/getActivations`,
  async ({ page, searchTerm = "" }) => {
    const q = searchTerm ? `&search=${searchTerm}` : "";
    const pureUrl = `/game-activation?page=${page}${q}`;
    const res = await callAPI(pureUrl, {
      method: "GET",
    });
    return res.data;
  }
);

export const createGameActivation = createAsyncThunk(
  `gameActivations/create`,
  async (activationData) => {
    const res = await callAPI(`/game-activation`, {
      method: "POST",
      data: activationData,
    });
    return res.data;
  }
);

export const getGameActivationDropdown = createAsyncThunk(
  `players/getGameActivationDropdown`,
  async () => {
    const res = await callAPI(`/game-info/list-dropdown`);
    return res.data;
  }
);

const gameSlice = createSlice({
  name: "gameActivation",
  initialState,
  reducers: {
    resetApiStateFromGameActivation(state, action) {
      const key = action.payload;
      if (state[key]) {
        state[key] = initialState[key];
      }
    },
  },
  extraReducers: (builder) => {
    handleApiState(builder, getGameActivations, "getGameActivationsApi");
    handleApiState(builder, createGameActivation, "createGameActivationApi");
    handleApiState(
      builder,
      getGameActivationDropdown,
      "getGameActivationDropdownApi"
    );
  },
});

export const { resetApiStateFromGameActivation } = gameSlice.actions;

export default gameSlice.reducer;
