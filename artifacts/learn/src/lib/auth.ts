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

export function setupAuthInterceptor() {
  const originalFetch = window.fetch;
  
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const token = getToken();
    
    if (token) {
      init = init || {};
      const headers = new Headers(init.headers);
      headers.set("Authorization", `Bearer ${token}`);
      init = { ...init, headers };
    }
    
    const response = await originalFetch(input, init);
    
    // Auto-logout on 401
    if (response.status === 401 && getToken()) {
      removeToken();
      window.location.href = "/";
    }
    
    return response;
  };
}
