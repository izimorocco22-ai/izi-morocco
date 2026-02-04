// utils/storage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const Token = 'accessToken';
const User = 'user';

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
};
