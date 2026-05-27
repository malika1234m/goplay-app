import * as SecureStore from "expo-secure-store";

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

// Registered by AuthProvider so a 401 anywhere auto-triggers logout
let _onAuthError: (() => void) | null = null;
export function setAuthErrorHandler(fn: () => void) {
  _onAuthError = fn;
}

async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync("goplay_token");
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error("Network error — check your internet connection.");
  }

  const data = await response.json().catch(() => ({}));

  if (response.status === 401 || response.status === 403) {
    const serverMsg = (data as { error?: string })?.error;
    if (serverMsg && serverMsg !== "Forbidden") {
      // Server sent a real error (e.g. wrong password) — show it as-is, don't logout
      throw new Error(serverMsg);
    }
    // No error body or generic "Forbidden" → expired/revoked token → clear session
    _onAuthError?.();
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error((data as { error?: string })?.error ?? "Request failed");
  }

  return data as T;
}

export const api = {
  get:    <T>(path: string)                => apiRequest<T>(path),
  post:   <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "POST",   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PUT",    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => apiRequest<T>(path, { method: "PATCH",  body: JSON.stringify(body) }),
  delete: <T>(path: string)               => apiRequest<T>(path, { method: "DELETE" }),
};

export async function uploadFormData<T = unknown>(path: string, body: FormData): Promise<T> {
  const token = await getToken();
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      body,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new Error("Network error — check your internet connection.");
  }
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 || response.status === 403) {
    const serverMsg = (data as { error?: string })?.error;
    if (serverMsg && serverMsg !== "Forbidden") {
      throw new Error(serverMsg);
    }
    _onAuthError?.();
    throw new Error("Session expired. Please log in again.");
  }
  if (!response.ok) {
    throw new Error((data as { error?: string })?.error ?? "Request failed");
  }
  return data as T;
}
