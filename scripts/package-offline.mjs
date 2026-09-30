import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

console.log("[+] Packaging SAT-SA Offline Bundle...");

// 1. Build the production application
console.log("   Running production build (Nitro/Vite)...");
execSync("npm run build", { stdio: "inherit" });

// 2. Prepare the bundle directory
const outDir = path.join(process.cwd(), "nciipc-sat-sa-offline");
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir);

// 3. Copy the output and necessary runner files
console.log("   Assembling air-gapped package...");
fs.cpSync(".vercel/output", path.join(outDir, ".vercel", "output"), { recursive: true });

const runnerScript = `
#!/usr/bin/env node
console.log("Starting SAT-SA Air-Gapped Supervisor Analytics Engine...");
console.log("Initializing local SQLite store...");
process.env.PORT = 8080;
process.env.HOST = "0.0.0.0";
process.env.NODE_ENV = "production";
import("./.vercel/output/functions/__server.func/index.mjs");
`;
fs.writeFileSync(path.join(outDir, "start.mjs"), runnerScript.trim());

const packageJson = {
  name: "sat-sa-offline-demo",
  version: "1.0.0",
  type: "module",
  scripts: {
    start: "node start.mjs"
  }
};
fs.writeFileSync(path.join(outDir, "package.json"), JSON.stringify(packageJson, null, 2));

console.log("[*] Offline package created successfully at ./nciipc-sat-sa-offline");
console.log("");
console.log("To run on any air-gapped machine with Node.js:");
console.log("  cd nciipc-sat-sa-offline");
console.log("  npm start");
console.log("");
console.log("No internet, cloud, or external dependencies required.");

