import { Router, type IRouter } from "express";
import { createTransport, type TransportOptions } from "nodemailer";
import { db, supportMessagesTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, getAuthUserId } from "../lib/auth";
import { ensureSupportMessagesTable } from "../lib/supportMessages";

const router: IRouter = Router();
const DEFAULT_SUPPORT_EMAIL = "krokodil22009@gmail.com";
const MAX_SUBJECT_LENGTH = 120;
const MAX_MESSAGE_LENGTH = 2000;

type SupportMessageBody = {
  subject: string;
  message: string;
  pageUrl?: string;
};

function parseSupportMessageBody(body: unknown): { success: true; data: SupportMessageBody } | { success: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { success: false, error: "Invalid support message body" };
  }

  const input = body as Record<string, unknown>;
  const subject = typeof input["subject"] === "string" ? input["subject"].trim() : "";
  const message = typeof input["message"] === "string" ? input["message"].trim() : "";
  const pageUrl = typeof input["pageUrl"] === "string" ? input["pageUrl"].trim() : undefined;

  if (subject.length > MAX_SUBJECT_LENGTH) {
    return { success: false, error: "Subject is too long" };
  }

  if (message.length < 5) {
    return { success: false, error: "Message is too short" };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { success: false, error: "Message is too long" };
  }

  return {
    success: true,
    data: {
      subject: subject || "Support request",
      message,
      pageUrl: pageUrl && pageUrl.length <= 300 ? pageUrl : undefined,
    },
  };
}

function getSupportEmail() {
  return process.env["SUPPORT_EMAIL_TO"] || DEFAULT_SUPPORT_EMAIL;
}

function getSmtpOptions(): TransportOptions | null {
  const host = process.env["SMTP_HOST"];
  const user = process.env["SMTP_USER"];
  const pass = process.env["SMTP_PASS"];
  const port = Number(process.env["SMTP_PORT"] || "587");

  if (!host || !user || !pass || !Number.isInteger(port)) {
    return null;
  }

  return {
    host,
    port,
    secure: process.env["SMTP_SECURE"] === "true" || port === 465,
    auth: { user, pass },
  };
}

function buildMailtoUrl(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

router.post("/support/contact", authMiddleware, async (req, res): Promise<void> => {
  const parsed = parseSupportMessageBody(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const userId = getAuthUserId(req);
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const supportEmail = getSupportEmail();
  const subject = `[CodePath support] ${parsed.data.subject}`;
  const body = [
    "New support message from CodePath.",
    "",
    `User: ${user.displayName || user.username} (@${user.username})`,
    `Email: ${user.email}`,
    parsed.data.pageUrl ? `Page: ${parsed.data.pageUrl}` : null,
    "",
    "Message:",
    parsed.data.message,
  ].filter(Boolean).join("\n");
  const mailto = buildMailtoUrl(supportEmail, subject, body);
  const smtpOptions = getSmtpOptions();

  await ensureSupportMessagesTable();
  const [savedMessage] = await db.insert(supportMessagesTable).values({
    userId: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    subject: parsed.data.subject,
    message: parsed.data.message,
    pageUrl: parsed.data.pageUrl,
  }).returning({ id: supportMessagesTable.id });

  if (!smtpOptions) {
    res.json({
      success: true,
      delivery: "stored",
      id: savedMessage.id,
      mailto,
      supportEmail,
    });
    return;
  }

  try {
    const transporter = createTransport(smtpOptions);
    await transporter.sendMail({
      from: process.env["SMTP_FROM"] || process.env["SMTP_USER"],
      to: supportEmail,
      replyTo: user.email,
      subject,
      text: body,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to send support email:", error);
    res.json({
      success: true,
      delivery: "stored",
      emailError: true,
      id: savedMessage.id,
      mailto,
      supportEmail,
    });
  }
});

export default router;
