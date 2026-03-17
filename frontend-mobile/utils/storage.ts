// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const Token = 'accessToken';
const User = 'user';
const GameTimer = 'gameTimer';

export const storage = {
  getAccessToken: () => AsyncStorage.getItem(Token),
  getUser: async () => {
    const user = await AsyncStorage.getItem(User);
    return user ? JSON.parse(user) : null;
  },
  setTokens: async (access: string) => {
    const ops: [string, string][] = [[Token, access]];
    await AsyncStorage.multiSet(ops);
  },
  setUser: async (user: any) => {
    await AsyncStorage.setItem(User, JSON.stringify(user));
  },
  clearTokens: () => AsyncStorage.multiRemove([Token, User]),
  
  // Game timer persistence
  getGameTimer: async (gameId: string) => {
    try {
      const timerData = await AsyncStorage.getItem(`${GameTimer}_${gameId}`);
      return timerData ? JSON.parse(timerData) : null;
    } catch (error) {
      console.error('Error getting game timer:', error);
      return null;
    }
  },
  
  setGameTimer: async (gameId: string, data: { startTime: number; elapsedTime: number; lastUpdateTime: number; totalDuration?: number }) => {
    try {
      await AsyncStorage.setItem(`${GameTimer}_${gameId}`, JSON.stringify(data));
    } catch (error) {
      console.error('Error setting game timer:', error);
    }
  },
  
  clearGameTimer: async (gameId: string) => {
    try {
      await AsyncStorage.removeItem(`${GameTimer}_${gameId}`);
    } catch (error) {
      console.error('Error clearing game timer:', error);
    }
  },
};
