const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
const TOKEN_KEY = "nuers_api_token";

function storedToken() {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function firstValidationError(errors: unknown) {
  if (!errors || typeof errors !== "object") return null;

  for (const value of Object.values(errors as Record<string, unknown>)) {
    if (Array.isArray(value) && value.length > 0) return String(value[0]);
    if (typeof value === "string") return value;
  }

  return null;
}

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function publicAssetUrl(path?: string | null) {
  const value = (path ?? "").trim();

  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const normalizedPath = value.startsWith("/") ? value : `/${value}`;

  if (normalizedPath.startsWith("/public/")) return normalizedPath;
  if (!API_BASE_URL) return normalizedPath;

  const normalizedBase = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;

  if (normalizedPath.startsWith(`${normalizedBase}/`)) return normalizedPath;
  if (normalizedBase.endsWith("/public") && normalizedPath.startsWith("/uploads/")) {
    return `${normalizedBase}${normalizedPath}`;
  }

  return normalizedPath;
}

export function apiHeaders(headers?: HeadersInit, options: { json?: boolean; auth?: boolean } = {}) {
  const nextHeaders = new Headers(headers);

  if (!nextHeaders.has("Accept")) nextHeaders.set("Accept", "application/json");
  if (options.json && !nextHeaders.has("Content-Type")) nextHeaders.set("Content-Type", "application/json");

  if (options.auth !== false && !nextHeaders.has("Authorization")) {
    const token = storedToken();
    if (token) nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  return nextHeaders;
}

export async function readJsonResponse<T = any>(response: Response, fallbackMessage = "Request failed.") {
  const contentType = response.headers.get("Content-Type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("API endpoint returned HTML instead of JSON. Check the live API deployment path.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.message || firstValidationError(payload?.errors) || fallbackMessage;
    throw new Error(String(message));
  }

  return payload as T;
}

export function apiFetch(path: string, init: RequestInit = {}) {
  const hasFormBody =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  return fetch(apiUrl(path), {
    ...init,
    headers: apiHeaders(init.headers, { json: Boolean(init.body) && !hasFormBody, auth: true }),
  });
}

export async function apiJson<T = any>(path: string, init: RequestInit = {}, fallbackMessage?: string) {
  const response = await apiFetch(path, init);
  return readJsonResponse<T>(response, fallbackMessage);
}
