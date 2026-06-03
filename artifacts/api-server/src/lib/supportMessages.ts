import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

let supportMessagesTableReady: Promise<void> | null = null;

export function ensureSupportMessagesTable() {
  if (!supportMessagesTableReady) {
    supportMessagesTableReady = db.execute(sql`
      CREATE TABLE IF NOT EXISTS support_messages (
        id serial PRIMARY KEY,
        user_id integer REFERENCES users(id) ON DELETE SET NULL,
        username text NOT NULL,
        email text NOT NULL,
        display_name text,
        subject text NOT NULL,
        message text NOT NULL,
        page_url text,
        status text NOT NULL DEFAULT 'new',
        created_at timestamp with time zone NOT NULL DEFAULT now(),
        resolved_at timestamp with time zone
      )
    `).then(() => undefined);
  }

  return supportMessagesTableReady;
}
