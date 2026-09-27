import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { api } from "./api";
import type { User } from "../lib/types";

type AuthState = { token: string | null; user: User | null };
const initialState: AuthState = {
  token: localStorage.getItem("token"),
  user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthState>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      if (action.payload.token) localStorage.setItem("token", action.payload.token);
      if (action.payload.user) localStorage.setItem("user", JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.clear();
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer, [api.reducerPath]: api.reducer }, middleware: (gDM) => gDM().concat(api.middleware) });
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
