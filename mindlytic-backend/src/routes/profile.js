const listQuerySchema = {
  type: "object",
  properties: {
    search: { type: "string", maxLength: 120 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
    sort: { type: "string", enum: ["asc", "desc"], default: "asc" },
  },
  additionalProperties: false,
};

export const registerProfileRoutes = async (app) => {
  app.get(
    "/profile",
    {
      schema: {
        querystring: listQuerySchema,
      },
    },
    async (request) => {
      const { search = "", limit = 50, sort = "asc" } = request.query;
      return app.repositories.listHobbies({ search, limit, sort });
    },
  );

  app.get(
    "/api/profile/hobbies",
    {
      schema: {
        querystring: listQuerySchema,
      },
    },
    async (request) => {
      const { search = "", limit = 50, sort = "asc" } = request.query;
      const hobbies = await app.repositories.listHobbies({ search, limit, sort });
      return {
        count: hobbies.length,
        data: hobbies,
      };
    },
  );
};
