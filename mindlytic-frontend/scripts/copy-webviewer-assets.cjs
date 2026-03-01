const fs = require("node:fs");
const path = require("node:path");

const sourceDir = path.resolve(__dirname, "../node_modules/@pdftron/webviewer/public");
const targetDir = path.resolve(__dirname, "../public/lib/webviewer");

if (!fs.existsSync(sourceDir)) {
  console.error("WebViewer public assets not found. Run: pnpm add @pdftron/webviewer");
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true, force: true });

console.log(`Copied WebViewer assets to ${targetDir}`);
