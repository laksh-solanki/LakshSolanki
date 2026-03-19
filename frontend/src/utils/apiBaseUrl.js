const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const DEFAULT_REMOTE_API = "https://backend.audit29122006.workers.dev";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

export const getApiBaseUrl = () => {
  const localUrl = import.meta.env.VITE_API_URL_1?.trim();
  const remoteUrl = import.meta.env.VITE_API_URL_2?.trim();
  const sharedUrl = import.meta.env.VITE_API_URL?.trim();
  const isLocal = LOCAL_HOSTS.has(window.location.hostname);

  const selectedUrl = isLocal
    ? localUrl || sharedUrl || "http://localhost:5001"
    : remoteUrl || sharedUrl || DEFAULT_REMOTE_API;

  return trimTrailingSlash(selectedUrl);
};
