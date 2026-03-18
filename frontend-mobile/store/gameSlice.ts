// store/gameSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ApiService from '../utils/apiService';
import { apiPaths } from '../utils/apiPaths';

type GameState = {
  isLoading: boolean;
  isGameLoading: boolean;
  isGameLoginLoading: boolean;
  isFinishingGameLoading: boolean;
  gameLoginResponse: any;
  gameFinishResponse?: any;
  games: any[];
  error?: any;
};

const initialState: GameState = {
  isLoading: false,
  isGameLoading: false,
  isGameLoginLoading: false,
  isFinishingGameLoading: false,
  gameLoginResponse: null,
  gameFinishResponse: null,
  games: [],
  error: null,
};

export const getGame = createAsyncThunk(
  'game/getGame',
  async (
    { page = 1, limit = 10 }: { page?: number; limit?: number },
    { rejectWithValue },
  ) => {
    try {
      const res = await ApiService({
        method: 'GET',
        endpoint: `${apiPaths.getGame}?page=${page}&limit=${limit}`,
      });
      return res;
    } catch (err: any) {
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

export const finishGame = createAsyncThunk(
  'game/finishGame',
  async (
    {
      gameId,
      activationCode,
      playerId,
      status,
      questions,
      score,
    }: {
      gameId: string;
      activationCode: string;
      playerId: string;
      status: string;
      questions: any;
      score: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const res = await ApiService({
        method: 'PUT',
        endpoint: apiPaths.getGame,
        data: { gameId, activationCode, playerId, status, questions, score },
      });
      console.log({ res });
      return res;
    } catch (err: any) {
      console.log({ err });
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

export const gameLogin = createAsyncThunk(
  'game/login',
  async (
    { activeCode, gameId }: { activeCode: string; gameId: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await ApiService({
        method: 'POST',
        endpoint: apiPaths.getGame,
        data: { activationCode: activeCode, gameId },
      });
      console.log({ res });
      return res;
    } catch (err: any) {
      // handle backend validation or auth errors
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    resetGame: () => initialState,
  },
  extraReducers: builder => {
    builder
      // get game
      .addCase(getGame.pending, state => {
        state.isGameLoading = true;
      })
      .addCase(getGame.fulfilled, (state, action) => {
        state.isGameLoading = false;
        const newGames = action.payload?.data?.docs || [];

        if (action.meta.arg?.page && action.meta.arg.page > 1) {
          // Append for next pages
          state.games.docs = [...(state.games.docs || []), ...newGames];
        } else {
          // First page
          state.games = action.payload?.data || [];
        }
      })
      .addCase(getGame.rejected, (state, action) => {
        state.isGameLoading = false;
        state.error = action.payload || action.error;
      })
      // game login
      .addCase(gameLogin.pending, state => {
        state.isGameLoginLoading = true;
      })
      .addCase(gameLogin.fulfilled, (state, action) => {
        state.isGameLoginLoading = false;
        state.gameLoginResponse = action.payload;
      })
      .addCase(gameLogin.rejected, (state, action) => {
        state.isGameLoginLoading = false;
        state.error = action.payload || action.error;
      })
      .addCase(finishGame.pending, state => {
        state.isFinishingGameLoading = true;
      })
      .addCase(finishGame.fulfilled, (state, action) => {
        state.isFinishingGameLoading = false;
        state.gameFinishResponse = action.payload;
      })
      .addCase(finishGame.rejected, (state, action) => {
        state.isFinishingGameLoading = false;
        state.error = action.payload || action.error;
      });
  },
});

export const { resetGame } = gameSlice.actions;

export default gameSlice.reducer;