export const registerErrorHandler = async (app, { nodeEnv }) => {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Unhandled request error");

    if (reply.sent) return;

    if (error.validation) {
      return reply.code(400).send({
        error: "Invalid request payload",
        details: error.validation.map((item) => ({
          path: item.instancePath,
          message: item.message,
        })),
      });
    }

    const statusCode =
      Number.isInteger(error.statusCode) && error.statusCode >= 400 ? error.statusCode : 500;

    const payload = {
      error: statusCode >= 500 ? "Internal Server Error" : error.message,
    };

    if (statusCode < 500 && error.course) {
      payload.data = error.course;
    }

    if (statusCode >= 500 && nodeEnv !== "production") {
      payload.details = error.message;
    }

    return reply.code(statusCode).send(payload);
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: "Route not found",
      path: request.url,
    });
  });
};
