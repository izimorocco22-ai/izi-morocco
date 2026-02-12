// utils/apiPaths.ts

import { gameLogin } from "../store/gameSlice";

export const apiPaths = {
  login: "auth/login",
  signup: "auth/signup",
  me: "player/me",
  verifyAccount: "auth/verify-account",
  forgetPassword: "auth/forget-password",
  setupPassword: "auth/setup-password",
  resendOtp: "auth/resend-otp",

  // game
  getGame:"games",
  infoGame: "game-info",
  gameLogin: "game-login",
  upload: "upload",
};
