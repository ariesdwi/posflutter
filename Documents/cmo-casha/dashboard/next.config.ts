import type { NextConfig } from "next";
import path from "path";
import fs from "fs";

// Load .env dari parent folder (project root) supaya API routes
// bisa mengakses META_ACCESS_TOKEN, INSTAGRAM_BUSINESS_ACCOUNT_ID, dll.
const parentEnv = path.resolve(__dirname, "../.env");
if (fs.existsSync(parentEnv)) {
  const lines = fs.readFileSync(parentEnv, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && val && !process.env[key]) {
      process.env[key] = val;
    }
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
