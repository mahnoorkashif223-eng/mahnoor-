import React from "react";
import ReactDOM from "react-dom/client";

// DEBUG: remove after verifying env vars on Vercel
console.log("[env-debug] VITE_SUPABASE_URL:", JSON.stringify(import.meta.env.VITE_SUPABASE_URL));
console.log("[env-debug] VITE_SUPABASE_ANON_KEY set:", !!import.meta.env.VITE_SUPABASE_ANON_KEY);
// @ts-expect-error -- font CSS side-effect import
import "@fontsource-variable/inter";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
