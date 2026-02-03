import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";

// Adjusting path to find your .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const courses = [
  { name: "Window Server administrator/IT Support Specialist" },
  { name: "Web Developer" },
  { name: "Cloud Engineer/Cloud Solution Architect" },
  { name: "Web & API Development Specialist" },
  { name: "Python for Computer Vision: Theory and Project" },
  { name: "Web Application Security Essentials" },
  { name: "VLSI Design Engineering" },
  { name: "Unity Android Gaming" },
  { name: "Time Series Analysis" },
  { name: "Tools for Predictive Analytics" },
];

const hobbies = [
  { name: "Reading Books" },
  { name: "Traveling" },
  { name: "Gaming" },
  { name: "Cooking" },
  { name: "Photography" },
];

const seedDB = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    const db = client.db("Mindlytic");

    // Clear and Insert
    await Promise.all([
      db.collection("courses").deleteMany({}),
      db.collection("hobbies").deleteMany({}),
    ]);

    await Promise.all([
      db.collection("courses").insertMany(courses),
      db.collection("hobbies").insertMany(hobbies),
    ]);

    console.log("✅ Database seeded successfully");
  } catch (err) {
    console.error("❌ Error seeding database:", err);
  } finally {
    await client.close();
  }
};

seedDB();