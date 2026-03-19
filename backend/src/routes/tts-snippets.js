const snippetQuerySchema = {
  type: "object",
  required: ["ownerKey"],
  properties: {
    ownerKey: { type: "string", minLength: 8, maxLength: 120 },
    limit: { type: "integer", minimum: 1, maximum: 20, default: 6 },
  },
  additionalProperties: false,
};

const createSnippetSchema = {
  type: "object",
  required: ["ownerKey", "content"],
  properties: {
    ownerKey: { type: "string", minLength: 8, maxLength: 120 },
    title: { type: "string", maxLength: 120 },
    content: { type: "string", minLength: 1, maxLength: 12000 },
  },
  additionalProperties: false,
};

const deleteSnippetSchema = {
  type: "object",
  required: ["ownerKey"],
  properties: {
    ownerKey: { type: "string", minLength: 8, maxLength: 120 },
  },
  additionalProperties: false,
};

const snippetParamsSchema = {
  type: "object",
  required: ["id"],
  properties: {
    id: { type: "string", minLength: 6, maxLength: 120 },
  },
  additionalProperties: false,
};

export const registerTtsSnippetRoutes = async (app) => {
  app.get(
    "/api/tts/snippets",
    {
      schema: {
        querystring: snippetQuerySchema,
      },
    },
    async (request, reply) => {
      reply.header("Cache-Control", "no-store");

      const { ownerKey, limit = 6 } = request.query;
      const snippets = await app.repositories.listTtsSnippets({
        ownerKey,
        limit,
      });

      return {
        count: snippets.length,
        data: snippets,
      };
    },
  );

  app.post(
    "/api/tts/snippets",
    {
      schema: {
        body: createSnippetSchema,
      },
    },
    async (request, reply) => {
      try {
        const created = await app.repositories.addTtsSnippet(request.body);
        return reply.code(201).send({
          message: "Snippet saved successfully",
          data: created,
        });
      } catch (error) {
        if (error?.statusCode && error.statusCode >= 400) {
          const payload = {
            error: error.message,
          };
          if (error.snippet) {
            payload.data = error.snippet;
          }
          return reply.code(error.statusCode).send(payload);
        }
        throw error;
      }
    },
  );

  app.delete(
    "/api/tts/snippets/:id",
    {
      schema: {
        params: snippetParamsSchema,
        querystring: deleteSnippetSchema,
      },
    },
    async (request, reply) => {
      const result = await app.repositories.removeTtsSnippet({
        id: request.params.id,
        ownerKey: request.query.ownerKey,
      });

      if (!result.removed) {
        return reply.code(404).send({ error: "Snippet not found" });
      }

      return reply.code(200).send({ message: "Snippet removed successfully" });
    },
  );
};
