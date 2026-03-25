import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// This file is used server-side only (Vercel API routes).
// Never import this in frontend code.
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

export * from "./schema";
