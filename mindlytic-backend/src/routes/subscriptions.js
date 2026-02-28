import { isValidEmail, normalizeEmail } from "../lib/email.js";

const subscriptionBodySchema = {
  type: "object",
  required: ["email"],
  properties: {
    email: { type: "string", maxLength: 320 },
    name: { type: "string", maxLength: 120 },
    source: { type: "string", maxLength: 64 },
  },
  additionalProperties: false,
};

const statusQuerySchema = {
  type: "object",
  required: ["email"],
  properties: {
    email: { type: "string", maxLength: 320 },
  },
  additionalProperties: false,
};

export const registerSubscriptionRoutes = async (app) => {
  app.post(
    "/api/subscribe",
    {
      schema: {
        body: subscriptionBodySchema,
      },
    },
    async (request, reply) => {
      const { email, name = "", source = "website" } = request.body;

      if (!isValidEmail(email)) {
        return reply.code(400).send({ error: "Email is invalid" });
      }

      const result = await app.repositories.subscribe({
        email: normalizeEmail(email),
        name,
        source,
        ip: request.ip,
        userAgent: request.headers["user-agent"] || "",
      });

      if (result.status === "already_subscribed") {
        return reply.code(409).send({ error: "Email already subscribed" });
      }

      if (result.status === "reactivated") {
        return reply.code(200).send({
          message: "Subscription restored successfully",
          id: result.subscription?.id,
        });
      }

      return reply.code(201).send({
        message: "Subscribed successfully",
        id: result.subscription?.id,
      });
    },
  );

  app.get(
    "/api/subscribe/status",
    {
      schema: {
        querystring: statusQuerySchema,
      },
    },
    async (request) => {
      const { email } = request.query;

      if (!isValidEmail(email)) {
        return {
          subscribed: false,
          status: "invalid_email",
        };
      }

      const result = await app.repositories.getSubscriptionStatus({ email });

      return {
        email: normalizeEmail(email),
        subscribed: result.subscribed,
        status: result.status,
        details: result.subscription,
      };
    },
  );

  app.delete(
    "/api/subscribe",
    {
      schema: {
        body: {
          type: "object",
          required: ["email"],
          properties: {
            email: { type: "string", maxLength: 320 },
          },
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body;

      if (!isValidEmail(email)) {
        return reply.code(400).send({ error: "Email is invalid" });
      }

      const result = await app.repositories.unsubscribe({ email });

      if (result.status === "not_found") {
        return reply.code(404).send({ error: "Subscription not found" });
      }

      if (result.status === "already_unsubscribed") {
        return reply.code(200).send({ message: "Already unsubscribed" });
      }

      return reply.code(200).send({ message: "Unsubscribed successfully" });
    },
  );
};
