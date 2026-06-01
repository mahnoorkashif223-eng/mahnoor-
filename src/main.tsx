import React from "react";
import ReactDOM from "react-dom/client";
// @ts-expect-error -- font CSS side-effect import
import "@fontsource-variable/inter";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
