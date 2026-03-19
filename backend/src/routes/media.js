const listMediaQuerySchema = {
  type: "object",
  properties: {
    type: { type: "string", maxLength: 40 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
    sort: { type: "string", enum: ["asc", "desc"], default: "desc" },
  },
  additionalProperties: false,
};

const createMediaSchema = {
  type: "object",
  required: ["url"],
  properties: {
    name: { type: "string", maxLength: 140 },
    url: { type: "string", minLength: 3, maxLength: 2048 },
    type: { type: "string", maxLength: 40 },
    alt: { type: "string", maxLength: 300 },
    tags: {
      type: "array",
      items: { type: "string", maxLength: 40 },
      maxItems: 30,
    },
  },
  additionalProperties: false,
};

export const registerMediaRoutes = async (app) => {
  app.get(
    "/api/media",
    {
      schema: {
        querystring: listMediaQuerySchema,
      },
    },
    async (request, reply) => {
      reply.header("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
      const { type = "", limit = 50, sort = "desc" } = request.query;
      const media = await app.repositories.listMedia({ type, limit, sort });

      return {
        count: media.length,
        data: media,
      };
    },
  );

  app.post(
    "/api/media",
    {
      schema: {
        body: createMediaSchema,
      },
    },
    async (request, reply) => {
      try {
        const created = await app.repositories.addMedia(request.body);
        return reply.code(201).send({
          message: "Media created successfully",
          data: created,
        });
      } catch (error) {
        if (error?.statusCode && error.statusCode >= 400) {
          const payload = {
            error: error.message,
          };
          if (error.media) {
            payload.data = error.media;
          }
          return reply.code(error.statusCode).send(payload);
        }
        throw error;
      }
    },
  );
};

