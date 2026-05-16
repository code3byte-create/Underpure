// src/app/App.jsx
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { useEffect } from "react";
import { useSiteSettingsStore } from "./store/siteSettingsStore";

export default function App() {
  const fetchSettings = useSiteSettingsStore((state) => state.fetchSettings);
  const storeName = useSiteSettingsStore((state) => state.storeName);

  // Jab app start ho (mount ho) toh backend se database wali settings mangwa lein
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Update tab title dynamically
  useEffect(() => {
    if (storeName) {
      document.title = storeName;
    }
  }, [storeName]);

  return <RouterProvider router={router} />;
}