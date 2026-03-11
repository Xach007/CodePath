import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupAuthInterceptor } from "./lib/auth";
import App from "./App";
import "./index.css";

// Setup global fetch interceptor to attach JWT token
setupAuthInterceptor();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
