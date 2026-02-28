import { requireAdminKey } from "../lib/adminAuth.js";
import { createPaginationMeta, resolvePagination } from "../lib/pagination.js";

const subscriptionListQuerySchema = {
  type: "object",
  properties: {
    page: { type: "integer", minimum: 1, default: 1 },
    pageSize: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    status: { type: "string", enum: ["active", "unsubscribed"] },
    search: { type: "string", maxLength: 120 },
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

const createHobbySchema = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", minLength: 2, maxLength: 120 },
    type: { type: "string", maxLength: 60 },
    frequency: { type: "string", maxLength: 40 },
  },
  additionalProperties: false,
};

export const registerAdminRoutes = async (app) => {
  const checkAdminAccess = async (request, reply) => {
    if (!requireAdminKey(request, reply, app.envConfig.adminApiKey)) {
      return reply;
    }
  };

  app.get(
    "/api/admin/stats",
    {
      preHandler: checkAdminAccess,
    },
    async () => {
      const stats = await app.repositories.getStats();
      return {
        generatedAt: new Date().toISOString(),
        database: app.dbStatus,
        ...stats,
      };
    },
  );

  app.get(
    "/api/admin/subscriptions",
    {
      preHandler: checkAdminAccess,
      schema: {
        querystring: subscriptionListQuerySchema,
      },
    },
    async (request) => {
      const { page, pageSize } = resolvePagination(
        request.query,
        app.envConfig.defaultPageSize,
        app.envConfig.maxPageSize,
      );
      const { status = "", search = "" } = request.query;
      const result = await app.repositories.listSubscriptions({
        page,
        pageSize,
        status,
        search,
      });

      return {
        data: result.data,
        meta: createPaginationMeta({
          page,
          pageSize,
          total: result.total,
        }),
      };
    },
  );

  app.post(
    "/api/admin/courses",
    {
      preHandler: checkAdminAccess,
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

  app.post(
    "/api/admin/hobbies",
    {
      preHandler: checkAdminAccess,
      schema: {
        body: createHobbySchema,
      },
    },
    async (request, reply) => {
      const created = await app.repositories.addHobby(request.body);
      return reply.code(201).send({
        message: "Hobby created successfully",
        data: created,
      });
    },
  );
};
