import { db, adminUsers } from "../../src/db/index.js";
import { eq } from "drizzle-orm";
import { signToken } from "../_lib/auth.js";
import { withCors, corsError, optionsResponse } from "../_lib/cors.js";
import bcrypt from "bcryptjs";

export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return corsError("Method not allowed", 405);

  try {
    const { email, password } = await req.json();
    if (!email || !password) return corsError("Email and password required", 400);

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email.toLowerCase())).limit(1);
    if (!user) return corsError("Invalid credentials", 401);

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return corsError("Invalid credentials", 401);

    const token = await signToken({ sub: user.id, email: user.email, role: user.role });
    return withCors({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
  } catch (err: any) {
    return corsError(err.message);
  }
}
