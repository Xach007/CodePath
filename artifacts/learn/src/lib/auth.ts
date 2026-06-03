import { api } from "@workspace/api-client-react";

// This file configures the global fetch interceptor to inject the JWT token
// This ensures all Orval-generated hooks automatically send the token.

const TOKEN_KEY = "auth_token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function redirectToHome() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const target = `${basePath}/`;

  if (window.location.pathname === target) return;

  window.history.pushState({}, "", target);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function getRequestPath(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return new URL(input, window.location.origin).pathname;
  }
  if (input instanceof URL) {
    return input.pathname;
  }
  if (input instanceof Request) {
    return new URL(input.url, window.location.origin).pathname;
  }
  return "";
}

function isAdminApiRequest(input: RequestInfo | URL) {
  return /\/api\/admin(?:\/|$)/.test(getRequestPath(input));
}

export function setupAuthInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = getToken();
    const isAdminRequest = isAdminApiRequest(input);
    
    if (token && !isAdminRequest) {
      const baseHeaders = init?.headers ?? (input instanceof Request ? input.headers : undefined);
      const headers = new Headers(baseHeaders);

      if (!headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      init = { ...init, headers };
    }
    
    const response = await originalFetch(input, init);
    
    // Auto-logout on 401
    if (response.status === 401 && getToken() && !isAdminRequest) {
      removeToken();
      window.sessionStorage.setItem("codepath_show_intro", "1");
      redirectToHome();
      window.dispatchEvent(new Event("codepath:show-intro"));
    }
    
    return response;
  };
}
