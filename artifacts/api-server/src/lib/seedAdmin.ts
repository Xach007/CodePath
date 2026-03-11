import { db } from "@workspace/db";
import { usersTable, userXPTable, userStreaksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth";

const ADMIN_USERNAME = "admin";
const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "admin123";

export async function seedAdminAccount(): Promise<boolean> {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, ADMIN_USERNAME));

  if (existing) {
    if (!existing.isAdmin) {
      await db.update(usersTable).set({ isAdmin: true }).where(eq(usersTable.id, existing.id));
    }
    return false;
  }

  const passwordHash = hashPassword(ADMIN_PASSWORD);
  const [admin] = await db.insert(usersTable).values({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    passwordHash,
    displayName: "Administrator",
    isAdmin: true,
  }).returning();

  await db.insert(userXPTable).values({ userId: admin.id, totalXP: 0, currentLevel: 1 });
  await db.insert(userStreaksTable).values({ userId: admin.id, currentStreak: 0, longestStreak: 0 });

  return true;
}

export function printAdminCredentials(): void {
  console.log("\n╔══════════════════════════════════════════╗");
  console.log("║         ADMIN LOGIN CREDENTIALS          ║");
  console.log("╠══════════════════════════════════════════╣");
  console.log("║  URL:      /admin                        ║");
  console.log("║  Username: admin                         ║");
  console.log("║  Password: admin123                      ║");
  console.log("║  Email:    admin@example.com              ║");
  console.log("╚══════════════════════════════════════════╝\n");
}
