import app from "./app";
import { seedAdminAccount, printAdminCredentials } from "./lib/seedAdmin";
import { seedData } from "./lib/seedData";
import { ensureDatabaseReady } from "@workspace/db";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await ensureDatabaseReady();

  app.listen(port, async () => {
    console.log(`Server listening on port ${port}`);

    try {
      const created = await seedAdminAccount();
      if (created) {
        console.log("✓ Admin account created");
      }
      printAdminCredentials();
    } catch (err) {
      console.error("Failed to seed admin account:", err);
    }

    try {
      await seedData();
    } catch (err) {
      console.error("Failed to seed data:", err);
    }
  });
}

start().catch((err) => {
  console.error("Failed to start API server:", err);
  process.exit(1);
});
