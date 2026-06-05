import React from "react";
import ReactDOM from "react-dom/client";

// DEBUG: remove after verifying env vars on Vercel
const _key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
console.log("[env-debug] URL:", JSON.stringify(import.meta.env.VITE_SUPABASE_URL));
console.log("[env-debug] KEY length:", _key.length, "first10:", _key.slice(0, 10), "last10:", _key.slice(-10));
console.log("[env-debug] KEY has bad chars:", /[\r\n\0]/.test(_key));
// @ts-expect-error -- font CSS side-effect import
import "@fontsource-variable/inter";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
