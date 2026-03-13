const listQuerySchema = {
  type: "object",
  properties: {
    search: { type: "string", maxLength: 120 },
    limit: { type: "integer", minimum: 1, maximum: 100, default: 50 },
    sort: { type: "string", enum: ["asc", "desc"], default: "asc" },
  },
  additionalProperties: false,
};

const createCourseSchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 2, maxLength: 140 },
    category: { type: "string", maxLength: 80 },
    level: { type: "string", maxLength: 40 },
    durationHours: { type: "number", minimum: 1, maximum: 1000 },
    tags: {
      type: "array",
      items: { type: "string", maxLength: 30 },
      maxItems: 20,
    },
  },
  additionalProperties: false,
};

export const registerCourseRoutes = async (app) => {
  const setCatalogCacheHeaders = (reply) => {
    reply.header("Cache-Control", "public, max-age=120, stale-while-revalidate=300");
  };

  app.get(
    "/api/courses",
    {
      schema: {
        querystring: listQuerySchema,
      },
    },
    async (request, reply) => {
      setCatalogCacheHeaders(reply);
      const { search = "", limit = 50, sort = "asc" } = request.query;
      const courses = await app.repositories.listCourses({ search, limit, sort });
      return {
        count: courses.length,
        data: courses,
      };
    },
  );

  app.post(
    "/api/courses",
    {
      schema: {
        body: createCourseSchema,
      },
    },
    async (request, reply) => {
      const created = await app.repositories.addCourse(request.body);
      return reply.code(201).send({
        message: "Course created successfully",
        data: created,
      });
    },
  );
};
