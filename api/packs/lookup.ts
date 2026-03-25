import { db, packs } from "../../src/db/index.js";
import { eq, sql } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "GET") return corsError("Method not allowed", 405);

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return corsError("code required", 400);

  const [pack] = await db.select().from(packs).where(eq(packs.pack_code, code.toUpperCase().trim())).limit(1);
  if (!pack) return corsError("Code invalide", 404);
  return withCors(pack);
}
