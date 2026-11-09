import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { appRouter } from "./router";
import { useAuthStore } from "./store/auth-store";

export function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    void initializeAuth();
  }, [initializeAuth]);

  return <RouterProvider router={appRouter} />;
}
