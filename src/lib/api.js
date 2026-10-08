/**
 * Central API client for the Clothing Delivery Platform backend.
 *
 * - Base URL comes from NEXT_PUBLIC_API_URL (never hardcoded in components).
 * - Understands the backend envelope: { success, message, data, errors? }.
 * - Stores the JWT from POST /api/auth/login and sends it as a Bearer header.
 * - Normalizes failures into ApiError (status, message, validation details)
 *   and emits an `auth:unauthorized` event on 401 so AuthProvider can react.
 *
 * Usage:
 *   import { api, getApiErrorMessage } from "@/lib/api";
 *   const { user, token } = await api.post("/auth/login", { email, password });
 *   const products = await api.get("/products", { query: { page: 1 } });
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const TOKEN_KEY = "cdp.token";
const UNAUTHORIZED_EVENT = "auth:unauthorized";

const DEFAULT_MESSAGES = {
  400: "Please check your input and try again.",
  401: "Your session has expired. Please sign in again.",
  403: "You do not have permission to perform this action.",
  404: "The requested resource was not found.",
  409: "This action conflicts with the current state.",
  422: "Please check your input and try again.",
};

export class ApiError extends Error {
  constructor(message, { status = 0, details = null, payload = null, sessionExpired = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.payload = payload;
    this.sessionExpired = sessionExpired;
  }
}

/* ---------------------------------------------------------------- token -- */

export function getToken() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode / storage disabled — session simply won't persist */
  }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/* ----------------------------------------------------------------- url --- */

function buildUrl(path, query) {
  const base = BASE_URL.replace(/\/+$/, "");
  const url = new URL(base + (path.startsWith("/") ? path : `/${path}`));
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/* -------------------------------------------------------------- request -- */

async function request(method, path, { body, query, headers, token, signal, auth = true, unwrap = true } = {}) {
  if (!BASE_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_URL is not configured. Copy .env.example to .env.local and restart the dev server.",
      { status: 0 }
    );
  }

  const finalHeaders = { Accept: "application/json", ...headers };
  const authToken = token !== undefined ? token : auth ? getToken() : null;
  if (authToken) finalHeaders.Authorization = `Bearer ${authToken}`;

  let payload;
  if (body !== undefined) {
    finalHeaders["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers: finalHeaders,
      body: payload,
      signal,
    });
  } catch {
    throw new ApiError("Unable to reach the server. Check your connection and try again.", {
      status: 0,
    });
  }

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      /* non-JSON body (proxy/HTML error page) — handled below */
    }
  }

  if (!response.ok) {
    const sessionExpired = response.status === 401 && Boolean(authToken);
    if (sessionExpired) {
      clearToken();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
      }
    }
    throw new ApiError(json?.message || DEFAULT_MESSAGES[response.status] || "Request failed.", {
      status: response.status,
      details: json?.errors ?? null,
      payload: json,
      sessionExpired,
    });
  }

  if (!unwrap) return json;
  return json?.data !== undefined ? json.data : json;
}

export const api = {
  request,
  get: (path, options) => request("GET", path, options),
  post: (path, body, options) => request("POST", path, { ...options, body }),
  put: (path, body, options) => request("PUT", path, { ...options, body }),
  patch: (path, body, options) => request("PATCH", path, { ...options, body }),
  delete: (path, options) => request("DELETE", path, options),
  /** Full envelope { success, message, data }; options.method defaults to GET. */
  raw: (path, options = {}) =>
    request(options.method || "GET", path, { ...options, unwrap: false }),
};

/* -------------------------------------------------------- error messages -- */

/**
 * User-facing message for any thrown error (see error-handling strategy):
 * 401 -> session expired, 403 -> access denied, 409 -> backend business rule,
 * 400/422 -> validation details, 500/network -> safe generic text.
 */
export function getApiErrorMessage(error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return error.sessionExpired
        ? "Your session has expired. Please sign in again."
        : error.message || "Invalid email or password.";
    }
    if (error.status === 403) return error.message || DEFAULT_MESSAGES[403];
    if (error.status === 400 || error.status === 422) {
      const details = error.details;
      if (Array.isArray(details) && details.length > 0) {
        return details.map((d) => d.message).filter(Boolean).join(" ") || error.message;
      }
      return error.message || DEFAULT_MESSAGES[400];
    }
    if (error.status >= 500) return "Something went wrong on our side. Please try again.";
    return error.message;
  }
  return error?.message || "Something went wrong. Please try again.";
}

export { UNAUTHORIZED_EVENT };
