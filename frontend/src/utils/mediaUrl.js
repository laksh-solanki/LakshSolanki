const encodeMediaKey = (key) =>
  String(key || "")
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURI(segment))
    .join("/");

const getMediaBaseUrl = () => {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const normalizedBaseUrl = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  return `${normalizedBaseUrl}media/`;
};

export const getMediaUrl = (key) => `${getMediaBaseUrl()}${encodeMediaKey(key)}`;
