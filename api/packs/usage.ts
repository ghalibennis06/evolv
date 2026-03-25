import { db, packUsageLog } from "../../src/db/index.js";
import { eq, desc } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "GET") return corsError("Method not allowed", 405);

  const url = new URL(req.url);
  const packId = url.searchParams.get("pack_id");
  if (!packId) return corsError("pack_id required", 400);

  const data = await db.select().from(packUsageLog)
    .where(eq(packUsageLog.pack_id, packId))
    .orderBy(desc(packUsageLog.used_at));

  return withCors(data);
}
