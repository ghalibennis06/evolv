import { db, adminUsers } from "../../src/db/index.js";
import { eq } from "drizzle-orm";
import { requireAdmin } from "../_lib/auth.js";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  try {
    const payload = await requireAdmin(req);
    const [user] = await db.select({ id: adminUsers.id, email: adminUsers.email, role: adminUsers.role, name: adminUsers.name })
      .from(adminUsers).where(eq(adminUsers.id, payload.sub)).limit(1);
    if (!user) return corsError("User not found", 404);
    return withCors({ ...user });
  } catch {
    return corsError("Unauthorized", 401);
  }
}
