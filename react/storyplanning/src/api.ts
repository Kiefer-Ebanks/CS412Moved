// File: api.ts
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/28/2026
// Description: API helpers for storyplanning React frontend.

// Base URL for Django API, will also use the VITE_API_BASE_URL when I deploy it
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/storyplanning";

// localStorage key used to persist auth token, this is used to store the token in the browser's localStorage
const TOKEN_KEY = "storyplanning_token";

// this is the shape of the response from the auth endpoints
type AuthResponse = {
  token: string;
  user_id: number;
  username: string;
};

/*
 * Returns saved token, or null if user is logged out
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/*
 * Saves token after login or register succeeds
 */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/*
 * Clears token from storage for logout
 */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/*
 * Sends login credentials and stores returned token
 */
export async function login(username: string, password: string): Promise<AuthResponse> {
  
  // Call token login endpoint to send the login credentials and store the returned token
  const response = await fetch(`${API_BASE}/api/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username, password: password }),
  });

  // Parse JSON body once to get the data from the response
  const data = await response.json();
  if (!response.ok) {
    const message = data && data.error ? data.error : "Login failed";
    throw new Error(message);
  }

  // ensure that the token is returned
  if (!data || !data.token) {
    throw new Error("No token returned by API");
  }

  // Save token for future authenticated requests
  setToken(data.token);
  return data as AuthResponse;
}

/*
 * Creates a user account and stores returned token
 */
export async function register(
  username: string,
  email: string,
  password: string,
): Promise<AuthResponse> {

  // Call token registration endpoint to send the registration credentials and store the returned token
  const response = await fetch(`${API_BASE}/api/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: username, email: email, password: password }),
  });

  // Parse JSON body once to get the data from the response
  const data = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  // ensure that the token is returned
  if (!data || !data.token) {
    throw new Error("No token returned by API");
  }

  // Save token for future authenticated requests
  setToken(data.token);
  return data as AuthResponse;
}

/*
 * Fetch wrapper that attaches Authorization header when a token exists
 */
export async function authFetch(path: string, init?: RequestInit): Promise<Response> {
  // Pull token from localStorage.
  const token = getToken();

  // Build headers from caller headers
  const initObject = init ? init : {};
  const headers = new Headers(initObject.headers ? initObject.headers : undefined);

  // Add token header for protected endpoints to ensure that the user is authenticated
  if (token) {
    headers.set("Authorization", `Token ${token}`);
  }

  // Build RequestInit to ensure that the request is authenticated
  const requestInit: RequestInit = {
    method: initObject.method,
    body: initObject.body,
    cache: initObject.cache,
    credentials: initObject.credentials,
    integrity: initObject.integrity,
    keepalive: initObject.keepalive,
    mode: initObject.mode,
    redirect: initObject.redirect,
    referrer: initObject.referrer,
    referrerPolicy: initObject.referrerPolicy,
    signal: initObject.signal,
    window: initObject.window,
    headers: headers,
  };

  // Make authenticated request to the API
  return fetch(`${API_BASE}${path}`, requestInit);
}

/*
 * Returns ideas visible to current token user.
 */
export async function getIdeas(): Promise<unknown> {

  // Hit the ideas endpoint to get the ideas
  const response = await authFetch("/api/ideas/");
  if (!response.ok) {
    throw new Error("Failed to fetch ideas");
  }

  // Return parsed JSON payload to get the data from the response
  return response.json();
}
