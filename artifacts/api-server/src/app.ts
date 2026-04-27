import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import router from "./routes";

const app: Express = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

export default app;
