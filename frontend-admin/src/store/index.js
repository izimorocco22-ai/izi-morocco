import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../slices/usersSlice";
import questionReducer from "../slices/questionSlice";
import tagReducer from "../slices/tagSlice";
import gameReducer from "../slices/gameSlice";
import puzzlesReducer from "../slices/PuzzlesSlice";
import gameActivationsReducer from "../slices/gameActivationSlice";
import playerReducer from "../slices/playerSlice";
import dashboardReducer from "../slices/dashboardSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    question: questionReducer,
    tag: tagReducer,
    games: gameReducer,
    puzzles: puzzlesReducer,
    gameActivation: gameActivationsReducer,
    player: playerReducer,
    dashboard: dashboardReducer,
  },
});

export default store;
