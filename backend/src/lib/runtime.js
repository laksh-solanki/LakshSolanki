export const getUptimeSeconds = () => {
  if (typeof process !== "object" || typeof process.uptime !== "function") {
    return null;
  }

  const uptime = process.uptime();
  if (!Number.isFinite(uptime)) {
    return null;
  }

  return Number(uptime.toFixed(1));
};
