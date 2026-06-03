import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, userXPTable, userStreaksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterBody,
  LoginBody,
  LoginResponse,
  GetMeResponse,
} from "@workspace/api-zod";
import { hashPassword, generateToken, authMiddleware, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();
const MAX_AVATAR_DATA_URL_LENGTH = 1_000_000;

type UpdateProfileBody = {
  displayName?: string;
  avatarUrl?: string | null;
};

function parseUpdateProfileBody(body: unknown): { success: true; data: UpdateProfileBody } | { success: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "Invalid profile update body" };
  }

  const input = body as Record<string, unknown>;
  const data: UpdateProfileBody = {};
  let hasField = false;

  if (Object.prototype.hasOwnProperty.call(input, "displayName")) {
    hasField = true;
    if (typeof input["displayName"] !== "string") {
      return { success: false, error: "Display name must be a string" };
    }

    const displayName = input["displayName"].trim();
    if (displayName.length < 1 || displayName.length > 80) {
      return { success: false, error: "Display name must be between 1 and 80 characters" };
    }
    data.displayName = displayName;
  }

  if (Object.prototype.hasOwnProperty.call(input, "avatarUrl")) {
    hasField = true;
    const avatarUrl = input["avatarUrl"];
    if (avatarUrl !== null && typeof avatarUrl !== "string") {
      return { success: false, error: "Avatar URL must be a string or null" };
    }
    if (typeof avatarUrl === "string" && avatarUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
      return { success: false, error: "Avatar image is too large" };
    }
    data.avatarUrl = avatarUrl;
  }

  if (!hasField) {
    return { success: false, error: "No profile fields provided" };
  }

  return { success: true, data };
}

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, email, password, displayName } = parsed.data;

  const existing = await db.select().from(usersTable)
    .where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const existingUsername = await db.select().from(usersTable)
    .where(eq(usersTable.username, username));
  if (existingUsername.length > 0) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    username,
    email,
    passwordHash,
    displayName: displayName ?? username,
  }).returning();

  await db.insert(userXPTable).values({ userId: user.id, totalXP: 0, currentLevel: 1 });
  await db.insert(userStreaksTable).values({ userId: user.id, currentStreak: 0, longestStreak: 0 });

  const token = generateToken(user.id);
  res.status(201).json(LoginResponse.parse({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  }));
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const passwordHash = hashPassword(password);

  const [user] = await db.select().from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user || user.passwordHash !== passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const token = generateToken(user.id);
  res.json(LoginResponse.parse({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
    token,
  }));
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});



router.get("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json(GetMeResponse.parse({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }));
});

router.patch("/auth/me", authMiddleware, async (req, res): Promise<void> => {
  const parsed = parseUpdateProfileBody(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const updates: { displayName?: string; avatarUrl?: string | null } = {};
  if (Object.prototype.hasOwnProperty.call(parsed.data, "displayName")) {
    updates.displayName = parsed.data.displayName;
  }
  if (Object.prototype.hasOwnProperty.call(parsed.data, "avatarUrl")) {
    updates.avatarUrl = parsed.data.avatarUrl ?? null;
  }

  const userId = getAuthUserId(req);
  const [user] = await db.update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, userId))
    .returning();

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json(GetMeResponse.parse({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  }));
});

export default router;
