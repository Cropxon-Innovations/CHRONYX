import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ChronyxErrorBoundary } from "./components/errors/ChronyxErrorBoundary";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ChronyxErrorBoundary>
      <App />
    </ChronyxErrorBoundary>
  </React.StrictMode>
);
