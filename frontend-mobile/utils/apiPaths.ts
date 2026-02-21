// utils/apiPaths.ts

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

  // team
  teamCreate: "team",
  teamMe: "team/me",
  teamJoin: "team/join",
  teamMembers: "team/members",
};
