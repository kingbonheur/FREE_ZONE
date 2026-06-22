import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true
});

export function assetUrl(path) {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("/assets") || path.startsWith("/src")) return path;
  return `${API_URL}${path}`;
}
