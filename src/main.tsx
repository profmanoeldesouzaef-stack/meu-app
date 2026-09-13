// Ensure __DEV__ and process are globally defined in browser/Vite environments
if (typeof (globalThis as any).__DEV__ === "undefined") {
  (globalThis as any).__DEV__ = (import.meta as any).env?.DEV ?? true;
}
if (typeof window !== "undefined" && typeof (window as any).__DEV__ === "undefined") {
  (window as any).__DEV__ = (import.meta as any).env?.DEV ?? true;
}

// Global unhandledrejection interceptor for transient WebSocket disconnects
if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    if (
      event.reason?.message?.includes("WebSocket") ||
      event.reason?.toString?.().includes("WebSocket")
    ) {
      event.preventDefault();
    }
  });
}

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
