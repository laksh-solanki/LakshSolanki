export const requireAdminKey = (request, reply, adminApiKey) => {
  if (!adminApiKey) {
    reply.code(503).send({
      error: "Admin API is disabled. Set ADMIN_API_KEY to enable admin routes.",
    });
    return false;
  }

  const providedApiKey = request.headers["x-admin-key"];
  if (!providedApiKey || providedApiKey !== adminApiKey) {
    reply.code(401).send({ error: "Unauthorized" });
    return false;
  }

  return true;
};
