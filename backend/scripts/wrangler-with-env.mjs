import { spawn } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config({
  path: path.resolve(process.cwd(), ".env"),
  quiet: true,
});

const wranglerCommand = process.argv[2] || "dev";
const passthroughArgs = process.argv.slice(3);

const dbName =
  process.env.MONGODB_DB_NAME?.trim() ||
  process.env.MONGODB_DB?.trim() ||
  process.env.DB_NAME?.trim() ||
  "LakshSolanki";

const defaultVars = {
  NODE_ENV: process.env.NODE_ENV?.trim() || "production",
  MONGODB_DB_NAME: dbName,
  MONGODB_DATA_SOURCE: process.env.MONGODB_DATA_SOURCE?.trim() || "Cluster0",
};

const optionalVars = {
  MONGODB_URI: process.env.MONGODB_URI?.trim() || "",
  MONGODB_DATA_API_URL: process.env.MONGODB_DATA_API_URL?.trim() || "",
  MONGODB_DATA_API_KEY: process.env.MONGODB_DATA_API_KEY?.trim() || "",
  MONGODB_SERVER_SELECTION_TIMEOUT_MS:
    process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS?.trim() || "",
  MONGODB_CONNECT_TIMEOUT_MS: process.env.MONGODB_CONNECT_TIMEOUT_MS?.trim() || "",
  CLOUDFLARE_TURNSTILE_SECRET_KEY:
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY?.trim() ||
    process.env.CLOUDFLARE_SECRET_KEY?.trim() ||
    process.env.VITE_CLOUDFLARE_SECRET_KEY?.trim() ||
    "",
};

const args = [wranglerCommand];

for (const [key, value] of Object.entries(defaultVars)) {
  args.push("--var", `${key}:${value}`);
}

for (const [key, value] of Object.entries(optionalVars)) {
  if (!value) continue;
  args.push("--var", `${key}:${value}`);
}

if (passthroughArgs.length > 0) {
  args.push(...passthroughArgs);
}

const wranglerBin = process.platform === "win32" ? "wrangler.cmd" : "wrangler";
const child = spawn(wranglerBin, args, {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code) => {
  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error("Failed to execute wrangler with .env variables:", error.message);
  process.exit(1);
});
