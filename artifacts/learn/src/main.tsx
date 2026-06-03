import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { setupAuthInterceptor } from "./lib/auth";
import App from "./App";
import "./index.css";

function applyInitialTheme() {
  try {
    const savedTheme = window.localStorage.getItem("theme");
    const useDarkTheme = savedTheme !== "light";
    document.documentElement.classList.toggle("dark", useDarkTheme);
    document.documentElement.style.colorScheme = useDarkTheme ? "dark" : "light";
  } catch {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }
}

applyInitialTheme();

// Setup global fetch interceptor to attach JWT token
setupAuthInterceptor();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
