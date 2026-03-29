let mongoRuntimePromise;

const getMongoRuntime = async () => {
  if (!mongoRuntimePromise) {
    mongoRuntimePromise = import("mongodb").then((module) => ({
      MongoClient: module.MongoClient,
      ServerApiVersion: module.ServerApiVersion,
    }));
  }

  return mongoRuntimePromise;
};

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
      db.collection("courses").createIndex(
        { normalizedName: 1 },
        {
          name: "uq_course_normalized_name",
          unique: true,
          partialFilterExpression: {
            normalizedName: { $type: "string" },
          },
        },
      ),
      db.collection("media").createIndex(
        { normalizedKey: 1 },
        {
          name: "uq_media_normalized_key",
          unique: true,
          partialFilterExpression: {
            normalizedKey: { $type: "string" },
          },
        },
      ),
      db.collection("media").createIndex(
        { type: 1, createdAt: -1 },
        { name: "idx_media_type_created" },
      ),
      db.collection("subscriptions").createIndex(
        { normalizedEmail: 1 },
        { unique: true, name: "uq_subscription_normalized_email" },
      ),
      db.collection("subscriptions").createIndex(
        { status: 1, createdAt: -1 },
        { name: "idx_subscription_status_created" },
      ),
      db.collection("tts_snippets").createIndex(
        { ownerKey: 1, createdAt: -1 },
        { name: "idx_tts_snippets_owner_created" },
      ),
      db.collection("tts_snippets").createIndex(
        { ownerKey: 1, normalizedContent: 1 },
        { name: "uq_tts_snippets_owner_content", unique: true },
      ),
      db.collection("ai_conversations").createIndex(
        { ownerUid: 1, updatedAt: -1 },
        { name: "idx_ai_conversations_owner_updated" },
      ),
      db.collection("ai_conversations").createIndex(
        { ownerUid: 1, id: 1 },
        { name: "uq_ai_conversations_owner_id", unique: true },
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

  let mongoRuntime;
  try {
    mongoRuntime = await getMongoRuntime();
  } catch (error) {
    app.decorate("mongoClient", null);
    app.decorate("db", null);
    app.decorate("dbStatus", createDisconnectedStatus("MongoDB driver could not be loaded"));
    app.log.error({ err: error }, "MongoDB driver failed to load in this runtime. Falling back to memory mode.");
    return;
  }

  const { MongoClient, ServerApiVersion } = mongoRuntime;

  const client = new MongoClient(env.mongodbUri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
    serverSelectionTimeoutMS: env.mongodbServerSelectionTimeoutMs,
    connectTimeoutMS: env.mongodbConnectTimeoutMs,
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
