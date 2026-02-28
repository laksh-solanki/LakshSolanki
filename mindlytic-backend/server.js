import fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

dotenv.config();

const app = fastify({logger: true});
const port = process.env.PORT || 5001;
const mongodbUri = process.env.MONGODB_URI;

if (!mongodbUri) {
  app.log.warn("MONGODB_URI is not defined. Database-backed routes will return 503.");
}

// MongoDB Client Setup
const client = mongodbUri
  ? new MongoClient(mongodbUri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    })
  : null;

let db;

const ensureDbReady = (reply) => {
  if (db) return true;
  reply.status(503).send({
    error: "Database is not configured. Set MONGODB_URI to enable this endpoint.",
  });
  return false;
};

// Register Plugins
app.register(cors);

// Routes
app.get("/", async (request, reply) => {
  return { status: "Backend working", time: new Date() };
});

app.get("/project/certificate-gen", async (request, reply) => {
  if (!ensureDbReady(reply)) return;

  try {
    const courses = await db.collection("courses").find({}).toArray();
    return courses;
  } catch (error) {
    app.log.error("Error fetching courses:", error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
});

app.get("/profile", async (request, reply) => {
  if (!ensureDbReady(reply)) return;

  try {
    const hobbies = await db.collection("hobbies").find({}).toArray();
    return hobbies;
  } catch (error) {
    app.log.error("Error fetching hobbies:", error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
});

app.post("/api/subscribe", async (request, reply) => {
  if (!ensureDbReady(reply)) return;

  const { email } = request.body;

  if (!email) {
    return reply.status(400).send({ error: "Email is required" });
  }

  try {
    const subscriptions = db.collection("subscriptions");
    const existingSubscription = await subscriptions.findOne({ email });

    if (existingSubscription) {
      return reply.status(409).send({ error: "Email already subscribed" });
    }

    const result = await subscriptions.insertOne({
      email,
      createdAt: new Date(),
    });
    return reply.status(201).send({
      message: "Subscribed successfully",
      id: result.insertedId,
    });
  } catch (error) {
    app.log.error("Error creating subscription:", error);
    reply.status(500).send({ error: "Internal Server Error" });
  }
});

const start = async () => {
  try {
    if (client) {
      await client.connect();
      db = client.db("Mindlytic");

      await db.command({ ping: 1 });
      app.log.info("Connected to MongoDB!");
    }

    await app.listen({
      port: Number(port),
      host: "0.0.0.0",
    });

    console.log(`Server is running at http://0.0.0.0:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
// Graceful Shutdown
process.on("SIGINT", async () => {
  if (client) {
    await client.close();
  }
  await app.close();
  process.exit(0);
});
