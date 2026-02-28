const listQuerySchema = {
  type: "object",
  properties: {
    search: { type: "string", maxLength: 120 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
    sort: { type: "string", enum: ["asc", "desc"], default: "asc" },
  },
  additionalProperties: false,
};

export const registerCourseRoutes = async (app) => {
  app.get(
    "/project/certificate-gen",
    {
      schema: {
        querystring: listQuerySchema,
      },
    },
    async (request) => {
      const { search = "", limit = 50, sort = "asc" } = request.query;
      return app.repositories.listCourses({ search, limit, sort });
    },
  );

  app.get(
    "/api/courses",
    {
      schema: {
        querystring: listQuerySchema,
      },
    },
    async (request) => {
      const { search = "", limit = 50, sort = "asc" } = request.query;
      const courses = await app.repositories.listCourses({ search, limit, sort });
      return {
        count: courses.length,
        data: courses,
      };
    },
  );
};
