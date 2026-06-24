import axios from "axios";

export const API_URL = "https://free-zone.onrender.com" || import.meta.env.VITE_API_URL;
const TOKEN_KEY = "freezone_token";

export const api = axios.create({
  baseURL: `${API_URL}/api`
});

api.interceptors.request.use((config) => {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function setApiToken(token) {
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }
}

export function clearApiToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export function assetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/assets") || path.startsWith("/src")) return path;
  return `${API_URL}${path}`;
}
