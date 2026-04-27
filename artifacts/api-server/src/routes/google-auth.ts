import { Router } from "express";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { db } from "@workspace/db";
import { usersTable, userXPTable, userStreaksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { generateToken } from "../lib/auth";
import crypto from "crypto";

const router = Router();

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] || "";
const GOOGLE_CLIENT_SECRET = process.env["GOOGLE_CLIENT_SECRET"] || "";
const DOMAIN = process.env["REPLIT_DOMAINS"]
  ? process.env["REPLIT_DOMAINS"].split(",")[0]
  : `localhost:${process.env["PORT"]}`;
const PROTOCOL = process.env["REPLIT_DOMAINS"] ? "https" : "http";
const FRONTEND_URL = `${PROTOCOL}://${DOMAIN}`;
const CALLBACK_URL = `${FRONTEND_URL}/api/auth/google/callback`;

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          const displayName = profile.displayName || email || "User";
          const avatarUrl = profile.photos?.[0]?.value || null;

          if (!email) {
            return done(new Error("No email returned from Google"));
          }

          let [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.email, email));

          if (!user) {
            const base = email
              .split("@")[0]
              .replace(/[^a-zA-Z0-9_.-]/g, "_")
              .slice(0, 28);
            let username = base || "user";
            let suffix = 1;
            while (true) {
              const existing = await db
                .select()
                .from(usersTable)
                .where(eq(usersTable.username, username));
              if (existing.length === 0) break;
              username = `${base}_${suffix++}`;
            }

            const randomHash = crypto.randomBytes(32).toString("hex");
            [user] = await db
              .insert(usersTable)
              .values({
                username,
                email,
                passwordHash: randomHash,
                displayName,
                avatarUrl,
              })
              .returning();

            await db
              .insert(userXPTable)
              .values({ userId: user.id, totalXP: 0, currentLevel: 1 });
            await db
              .insert(userStreaksTable)
              .values({ userId: user.id, currentStreak: 0, longestStreak: 0 });
          }

          done(null, user);
        } catch (err) {
          done(err as Error);
        }
      }
    )
  );
}

passport.serializeUser((user: any, done) => done(null, user.id));
passport.deserializeUser((id: any, done) => done(null, { id }));

router.get(
  "/auth/google",
  (req, res, next) => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      res.status(503).json({ error: "Google OAuth is not configured" });
      return;
    }
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${FRONTEND_URL}/?googleError=1`,
  }),
  (req, res) => {
    const user = req.user as any;
    const token = generateToken(user.id);
    res.redirect(`${FRONTEND_URL}/?token=${token}`);
  }
);

export default router;
