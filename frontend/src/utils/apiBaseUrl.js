const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
const DEFAULT_REMOTE_API = "https://lakshsolanki-backend.vercel.app";
const DEFAULT_LOCAL_API = "http://localhost:5001";

const trimTrailingSlash = (value = "") =>
  String(value || "")
    .trim()
    .replace(/\/+$/, "");

export const isLocalEnv = () => {
  if (typeof window === "undefined") return true;
  return LOCAL_HOSTS.has(window.location.hostname);
};

export const getApiBaseUrl = () => {
  const sharedUrl = import.meta.env.VITE_API_URL?.trim();
  const localUrl = import.meta.env.VITE_API_URL_1?.trim();
  const remoteUrl = import.meta.env.VITE_API_URL_2?.trim();

  // VITE_API_URL overrides everything when set
  if (sharedUrl) return trimTrailingSlash(sharedUrl);

  const local = isLocalEnv();
  const resolved = local
    ? localUrl || DEFAULT_LOCAL_API
    : remoteUrl || DEFAULT_REMOTE_API;

  return trimTrailingSlash(resolved);
};

export const getRemoteApiBaseUrl = () => {
  const remoteUrl = import.meta.env.VITE_API_URL_2?.trim();
  return trimTrailingSlash(remoteUrl || DEFAULT_REMOTE_API);
};
