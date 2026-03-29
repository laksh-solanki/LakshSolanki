import { createFirebaseTokenVerifier } from "../lib/firebase-auth.js";

const historyQuerySchema = {
  type: "object",
  properties: {
    limit: { type: "integer", minimum: 1, maximum: 50, default: 30 },
  },
  additionalProperties: false,
};

const historyParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", minLength: 6, maxLength: 120 },
  },
  additionalProperties: false,
};

const historyUpsertSchema = {
  type: "object",
  required: ["messages"],
  properties: {
    title: { type: "string", maxLength: 120 },
    messages: {
      type: "array",
      minItems: 1,
      maxItems: 80,
      items: {
        type: "object",
        required: ["role", "text"],
        properties: {
          role: { type: "string", enum: ["user", "assistant"] },
          text: { type: "string", minLength: 1, maxLength: 12000 },
          createdAt: { type: "string", maxLength: 64 },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
};

const normalizeId = (value = "") => String(value || "").trim();

export const registerAiHistoryRoutes = async (app) => {
  let verifier = null;

  const requireAuth = async (request, reply) => {
    if (!app.envConfig.firebaseProjectId && !app.envConfig.firebaseAuthTestMode) {
      return reply.code(503).send({
        error: "Firebase auth is not configured on this backend.",
      });
    }

    if (!verifier) {
      verifier = createFirebaseTokenVerifier({
        projectId: app.envConfig.firebaseProjectId,
        jwksUrl: app.envConfig.firebaseJwksUrl,
        testMode: app.envConfig.firebaseAuthTestMode,
      });
    }

    try {
      const user = await verifier.verifyAuthorizationHeader(request.headers.authorization);
      request.authUser = user;
    } catch (error) {
      return reply.code(401).send({
        error: "Unauthorized",
        details: error?.message || "Invalid Firebase token.",
      });
    }
  };

  app.get(
    "/api/ai/history",
    {
      preHandler: requireAuth,
      schema: {
        querystring: historyQuerySchema,
      },
    },
    async (request) => {
      const limit = Number.isInteger(request.query.limit) ? request.query.limit : 30;
      const items = await app.repositories.listAiConversations({
        ownerUid: request.authUser.uid,
        limit,
      });

      return {
        count: items.length,
        data: items,
      };
    },
  );

  app.get(
    "/api/ai/history/:id",
    {
      preHandler: requireAuth,
      schema: {
        params: historyParamsSchema,
      },
    },
    async (request, reply) => {
      const conversation = await app.repositories.getAiConversation({
        ownerUid: request.authUser.uid,
        id: normalizeId(request.params.id),
      });

      if (!conversation) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      return {
        data: conversation,
      };
    },
  );

  app.put(
    "/api/ai/history/:id",
    {
      preHandler: requireAuth,
      schema: {
        params: historyParamsSchema,
        body: historyUpsertSchema,
      },
    },
    async (request) => {
      const saved = await app.repositories.upsertAiConversation({
        ownerUid: request.authUser.uid,
        ownerEmail: request.authUser.email,
        ownerName: request.authUser.name,
        id: normalizeId(request.params.id),
        title: request.body.title || "",
        messages: request.body.messages || [],
      });

      return {
        message: "Conversation saved successfully",
        data: saved,
      };
    },
  );

  app.delete(
    "/api/ai/history/:id",
    {
      preHandler: requireAuth,
      schema: {
        params: historyParamsSchema,
      },
    },
    async (request, reply) => {
      const result = await app.repositories.removeAiConversation({
        ownerUid: request.authUser.uid,
        id: normalizeId(request.params.id),
      });

      if (!result.removed) {
        return reply.code(404).send({ error: "Conversation not found" });
      }

      return {
        message: "Conversation removed successfully",
      };
    },
  );
};
