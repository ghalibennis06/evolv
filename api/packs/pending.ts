import { db, codeCreationRequests } from "../../src/db/index.js";
import { eq, desc } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "GET") return corsError("Method not allowed", 405);

  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  if (!email) return corsError("email required", 400);

  const [latest] = await db.select().from(codeCreationRequests)
    .where(eq(codeCreationRequests.client_email, email.toLowerCase().trim()))
    .orderBy(desc(codeCreationRequests.created_at))
    .limit(1);

  return withCors(latest ?? null);
}
