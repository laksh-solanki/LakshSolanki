import { MongoClient, ServerApiVersion } from "mongodb";

const createDisconnectedStatus = (reason) => ({
  mode: "memory",
  enabled: false,
  connected: false,
  reason,
  updatedAt: new Date().toISOString(),
});

const createConnectedStatus = () => ({
  mode: "mongo",
  enabled: true,
  connected: true,
  reason: "",
  updatedAt: new Date().toISOString(),
});

const ensureIndexes = async (db, log) => {
  try {
    await Promise.all([
      db.collection("courses").createIndex({ name: 1 }, { name: "idx_course_name" }),
      db.collection("hobbies").createIndex({ name: 1 }, { name: "idx_hobby_name" }),
      db.collection("subscriptions").createIndex(
        { normalizedEmail: 1 },
        { unique: true, name: "uq_subscription_normalized_email" },
      ),
      db.collection("subscriptions").createIndex(
        { status: 1, createdAt: -1 },
        { name: "idx_subscription_status_created" },
      ),
    ]);
  } catch (error) {
    log.warn({ err: error }, "Index creation skipped due to an existing index or conflicting data.");
  }
};

export const registerDatabase = async (app, env) => {
  if (!env.mongodbUri) {
    app.decorate("mongoClient", null);
    app.decorate("db", null);
    app.decorate("dbStatus", createDisconnectedStatus("MONGODB_URI not configured"));
    app.log.warn("MONGODB_URI is not defined. Running in memory-only mode.");
    return;
  }

  const client = new MongoClient(env.mongodbUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();
    const db = client.db(env.mongodbDbName);
    await db.command({ ping: 1 });
    await ensureIndexes(db, app.log);

    app.decorate("mongoClient", client);
    app.decorate("db", db);
    app.decorate("dbStatus", createConnectedStatus());

    app.addHook("onClose", async () => {
      await client.close();
    });

    app.log.info({ dbName: env.mongodbDbName }, "Connected to MongoDB.");
  } catch (error) {
    app.log.error({ err: error }, "MongoDB connection failed. Falling back to memory mode.");

    app.decorate("mongoClient", null);
    app.decorate("db", null);
    app.decorate("dbStatus", createDisconnectedStatus("MongoDB connection failed"));

    try {
      await client.close();
    } catch {
      // Ignore cleanup errors for failed connection attempts.
    }
  }
};
