/**
 * Local Database Setup Script for Dr. Orthos Desktop / Local Mode
 * 
 * Verifies local PostgreSQL connection, creates database if missing,
 * and pushes the Prisma schema locally.
 */

import { execSync } from "child_process";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  console.log("==================================================");
  console.log("🏥 Dr. Orthos - Local Database Setup (Eka Care Mode)");
  console.log("==================================================");
  console.log("");
  console.log("This script initializes your local PostgreSQL database so the");
  console.log("software can run 100% offline with zero latency on this computer.");
  console.log("");

  const localDbUrl =
    process.env.LOCAL_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgresql://postgres:postgres@localhost:5432/dr_orthos_local";

  console.log(`Target Local Database: ${localDbUrl}`);
  console.log("");

  try {
    console.log("📦 Syncing Prisma schema to local database...");
    execSync("npx prisma db push --skip-generate", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: localDbUrl,
        DIRECT_URL: localDbUrl,
      },
    });

    console.log("");
    console.log("✅ Local PostgreSQL schema initialized successfully!");
    console.log("💡 You can now run the app offline using your local database.");
  } catch (error) {
    console.error("");
    console.error("❌ Failed to push schema to local PostgreSQL.");
    console.error("Please verify that PostgreSQL is running locally on port 5432.");
    console.error("Default connection string: postgresql://postgres:postgres@localhost:5432/dr_orthos_local");
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
