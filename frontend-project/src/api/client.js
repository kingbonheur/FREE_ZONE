import axios from "axios";

export const API_URL = "https://free-zone.onrender.com" || import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true
});

export function assetUrl(path) {
  if (!path) return "";
  if (path.startsWith("https://") || path.startsWith("/assets") || path.startsWith("/src")) return path;
  return `${API_URL}${path}`;
}
