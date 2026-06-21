import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const frontendDirectory = join(currentDirectory, "..");
const distDirectory = join(frontendDirectory, "dist");

const spaRoutes = [
  "/about",
  "/projects",
  "/projects/certificate-gen",
  "/projects/img-pdf",
  "/projects/pdf-img",
  "/projects/text-to-speech",
  "/projects/mindlytic_ai",
  "/projects/json-forge",
  "/projects/web-lab-compiler",
  "/projects/dev-utility-hub",
  "/projects/translate-studio",
  "/projects/passport-cutter",
  "/projects/api-blueprint",
  "/projects/lifeflow-planner",
  "/notfound",
];

const indexHtml = await readFile(join(distDirectory, "index.html"), "utf8");

await Promise.all(
  spaRoutes.map(async (route) => {
    const routeDirectory = join(
      distDirectory,
      ...route.split("/").filter(Boolean),
    );

    await mkdir(routeDirectory, { recursive: true });
    await writeFile(join(routeDirectory, "index.html"), indexHtml);
  }),
);

console.log(`Created static entry pages for ${spaRoutes.length} SPA routes.`);
