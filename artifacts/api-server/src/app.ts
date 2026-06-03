import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import path from "node:path";
import fs from "node:fs";
import router from "./routes";

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(
  session({
    secret: process.env["SESSION_SECRET"] || "codepath-oauth-session-2024",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 10 * 60 * 1000 },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api", router);

if (process.env["NODE_ENV"] === "production") {
  const frontendCandidates = [
    path.resolve(process.cwd(), "artifacts/learn/dist/public"),
    path.resolve(process.cwd(), "../learn/dist/public"),
    path.resolve(process.cwd(), "dist/public"),
  ];
  const frontendPath = frontendCandidates.find((candidate) => fs.existsSync(candidate));

  if (frontendPath) {
    app.use(express.static(frontendPath));
    app.get(/^\/(?!api).*/, (_req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });
  }
}

export default app;
