import { MongoClient, ServerApiVersion } from "mongodb";
import { DEFAULT_COURSES, DEFAULT_HOBBIES } from "./src/constants/defaultData.js";
import { getEnv } from "./src/config/env.js";

const env = getEnv();
const args = new Set(process.argv.slice(2));
const appendMode = args.has("--append");

if (!env.mongodbUri) {
  console.error("MONGODB_URI is required for seeding.");
  process.exit(1);
}

const client = new MongoClient(env.mongodbUri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const attachTimestamps = (records) => {
  const now = new Date().toISOString();
  return records.map((record) => ({
    ...record,
    createdAt: now,
    updatedAt: now,
  }));
};

const seed = async () => {
  try {
    await client.connect();
    const db = client.db(env.mongodbDbName);
    const coursesCollection = db.collection("courses");
    const hobbiesCollection = db.collection("hobbies");

    if (!appendMode) {
      await Promise.all([coursesCollection.deleteMany({}), hobbiesCollection.deleteMany({})]);
    }

    if (appendMode) {
      const now = new Date().toISOString();
      const courseOps = DEFAULT_COURSES.map((course) => ({
        updateOne: {
          filter: { name: course.name },
          update: {
            $setOnInsert: { ...course, createdAt: now },
            $set: { ...course, updatedAt: now },
          },
          upsert: true,
        },
      }));

      const hobbyOps = DEFAULT_HOBBIES.map((hobby) => ({
        updateOne: {
          filter: { name: hobby.name },
          update: {
            $setOnInsert: { ...hobby, createdAt: now },
            $set: { ...hobby, updatedAt: now },
          },
          upsert: true,
        },
      }));

      await Promise.all([
        coursesCollection.bulkWrite(courseOps, { ordered: false }),
        hobbiesCollection.bulkWrite(hobbyOps, { ordered: false }),
      ]);
    } else {
      await Promise.all([
        coursesCollection.insertMany(attachTimestamps(DEFAULT_COURSES)),
        hobbiesCollection.insertMany(attachTimestamps(DEFAULT_HOBBIES)),
      ]);
    }

    const [courseCount, hobbyCount] = await Promise.all([
      coursesCollection.countDocuments({}),
      hobbiesCollection.countDocuments({}),
    ]);

    console.log(
      `Seed complete for database "${env.mongodbDbName}" | courses: ${courseCount}, hobbies: ${hobbyCount}`,
    );
  } catch (error) {
    console.error("Error while seeding data:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
};

void seed();
