import { configureStore } from '@reduxjs/toolkit';
// import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    // [Phase 1.0] Reducers will be added as slices are created
    // user: userReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
