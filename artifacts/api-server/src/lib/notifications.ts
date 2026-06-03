import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

let notificationsTableReady: Promise<void> | null = null;

export function ensureUserNotificationsTable() {
  if (!notificationsTableReady) {
    notificationsTableReady = db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_notifications (
        id serial PRIMARY KEY,
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title text NOT NULL,
        message text NOT NULL,
        type text NOT NULL DEFAULT 'admin',
        source_support_message_id integer,
        read_at timestamp with time zone,
        created_at timestamp with time zone NOT NULL DEFAULT now()
      )
    `).then(() => undefined);
  }

  return notificationsTableReady;
}
