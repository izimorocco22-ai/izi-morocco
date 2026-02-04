// store/authSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { storage } from '../utils/storage';
import ApiService from '../utils/apiService';
import { apiPaths } from '../utils/apiPaths';

type AuthState = {
  isLoading: boolean;
  isInitLoading?: boolean;
  isSignUpLoading?: boolean;
  isSignInLoading?: boolean;
  isOtpLoading?: boolean;
  loginResponse?: any;
  token: string | null;
  user: { id: string; email: string; name?: string } | null;
  isVerified?: boolean;
  error?: any;
};

const initialState: AuthState = {
  isLoading: false,
  isInitLoading: false,
  isSignUpLoading: false,
  isSignInLoading: false,
  isOtpLoading: false,
  loginResponse: null,
  token: null,
  user: null,
  isVerified: false,
  error: null,
};

// init token and user
export const init = createAsyncThunk('auth/init', async (_, thunkAPI) => {
  try {
    const token = await storage.getAccessToken();
    if (token) {
      // Try to get cached user first
      const cachedUser = await storage.getUser();
      
      try {
        const me = await ApiService({
          method: 'GET',
          endpoint: apiPaths.me,
        });
        
        // Update cached user
        await storage.setUser(me?.data);

        return {
          token,
          user: me?.data,
          isVerified: me?.data?.isVerified || false,
        }; 
      } catch (apiError: any) {
        console.log('Init API error:', apiError);
        
        // If 401/403, token is invalid, clear it
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
             await storage.clearTokens();
             return { token: null, user: null, isVerified: false };
        }

        // For other errors (network, server), use cached user if available
        if (cachedUser) {
           console.log('Using cached user due to API error');
           return {
             token,
             user: cachedUser,
             isVerified: cachedUser.isVerified || false,
           };
        }
        
        // If no cache and API failed, we can't restore session fully.
        // But we preserve the token in storage for next time.
        throw apiError;
      }
    }
    return { token: null, user: null, isVerified: false };
  } catch (err) {
    // If we reach here, it's either a storage error or a rethrown API error (no cache).
    // We do NOT clear tokens here automatically, to prevent logout on network error.
    // Unless we know for sure... but we handled 401 above.
    
    return { token: null, user: null, isVerified: false };
  }
});

// login
export const signIn = createAsyncThunk(
  'auth/signIn',
  async (
    { email, password }: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await ApiService({
        method: 'POST',
        endpoint: apiPaths.login,
        data: { email:email.toLowerCase(), password },
      });
      await storage.setTokens(res?.token);
      // return {
      //   token,
      //   user: me?.data,
      //   isVerified: me?.data?.isVerified || false,
      // };
      return res;
    } catch (err: any) {
      console.log({err})
      // handle backend validation or auth errors
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

// register
export const signUp = createAsyncThunk(
  'auth/signUp',
  async (
    payload: { name: string; email: string; password: string; phone: string },
    { rejectWithValue },
  ) => {
    try {
      const res = await ApiService({
        method: 'POST',
        endpoint: apiPaths.signup,
        data: payload,
      });
      await storage.setTokens(res?.token);

      return res;
    } catch (err: any) {
      // if backend sends validation error
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await storage.clearTokens(); // clear async storage
  return { token: null, user: null };
});

export const verifyAccount = createAsyncThunk(
  'auth/verifyAccount',
  async ({ data }: { data: any }, { rejectWithValue }) => {
    try {
      const response = await ApiService({
        method: 'POST',
        endpoint: apiPaths.verifyAccount,
        data: data,
      });
      console.log({response})
      return response; // Return the response
    } catch (err: any) {
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

export const forgetPassword = createAsyncThunk(
  'auth/forgetPassword',
  async ({ email }: { email: string }, { rejectWithValue }) => {
    try {
      const response = await ApiService({
        method: 'POST',
        endpoint: apiPaths.forgetPassword,
        data: { email },
      });
      return response;
    } catch (err: any) {
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

export const setupPassword = createAsyncThunk(
  'auth/setupPassword',
  async ({ data }: { data: any }, { rejectWithValue }) => {
    try {
      const response = await ApiService({
        method: 'POST',
        endpoint: apiPaths.setupPassword,
        data: data,
      });
      return response;
    } catch (err: any) {
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

export const resendOtp = createAsyncThunk(
  'auth/resendOtp',
  async (
    { email, reqFor }: { email: string; reqFor: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await ApiService({
        method: 'POST',
        endpoint: apiPaths.resendOtp,
        data: { email, reqFor },
      });
      return response;
    } catch (err: any) {
      if (err?.response?.data) {
        return rejectWithValue(err.response.data);
      }
      return rejectWithValue({ message: 'Something went wrong' });
    }
  },
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    resetAuth: () => initialState,
  },
  extraReducers: builder => {
    builder
      // init
      .addCase(init.pending, state => {
        state.isInitLoading = true;
      })
      .addCase(init.fulfilled, (state, action) => {
        state.isInitLoading = false;
        state.token = action.payload?.token || null;
        state.isVerified = action.payload?.isVerified || false;
        state.user = action.payload?.user;
      })
      .addCase(init.rejected, (state, action) => {
        state.isInitLoading = false;
        state.token = null;
        state.user = null;
        state.error = action.payload || action.error; // store error if needed
      })

      // signIn
      .addCase(signIn.pending, state => {
        state.isSignInLoading = true;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.isSignInLoading = false;
        state.loginResponse = action.payload;
        state.token = action.payload.token;
      })
      .addCase(signIn.rejected, state => {
        state.isSignInLoading = false;
      })
      // signUp
      .addCase(signUp.pending, state => {
        state.isSignUpLoading = true;
      })
      .addCase(signUp.fulfilled, (state,action) => {
        state.isSignUpLoading = false;
        state.token = action.payload?.token || null;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.isSignUpLoading = false;
        state.error = action.payload || action.error; // store backend error
      })
      // verifyAccount
      .addCase(verifyAccount.pending, state => {
        state.isOtpLoading = true;
      })
      .addCase(verifyAccount.fulfilled, state => {
        state.isOtpLoading = false;
      })
      .addCase(verifyAccount.rejected, (state, action) => {
        state.isOtpLoading = false;
        state.error = action.payload || action.error; // store backend error
      })

      // forgetPassword
      .addCase(forgetPassword.pending, state => {
        state.isLoading = true;
      })
      .addCase(forgetPassword.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(forgetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error;
      })

      // setupPassword
      .addCase(setupPassword.pending, state => {
        state.isLoading = true;
      })
      .addCase(setupPassword.fulfilled, state => {
        state.isLoading = false;
      })
      .addCase(setupPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error;
      })

      // resendOtp
      .addCase(resendOtp.pending, state => {
        state.isOtpLoading = true;
      })
      .addCase(resendOtp.fulfilled, (state, action) => {
        state.isOtpLoading = false;
        state.error = null;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.isOtpLoading = false;
        state.error = action.payload || action.error;
      })

      // signOut
      .addCase(signOut.fulfilled, state => {
        state.isLoading = false;
        state.token = null;
        state.user = null;
        state.loginResponse = null;
        state.error = null;
      });
  },
});

export const { resetAuth } = authSlice.actions;

export default authSlice.reducer;
