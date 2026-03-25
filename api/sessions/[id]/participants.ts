import { db, sessionParticipants } from "../../../src/db/index.js";
import { eq } from "drizzle-orm";
import { withCors, corsError, optionsResponse } from "../../_lib/cors.js";

export const config = { runtime: "edge" };

export default async function handler(req: Request, { params }: { params: { id: string } }) {
  if (req.method === "OPTIONS") return optionsResponse();
  const { id } = params;

  if (req.method === "POST") {
    try {
      const body = await req.json();
      const [participant] = await db.insert(sessionParticipants).values({ ...body, session_id: id }).returning();
      return withCors(participant, 201);
    } catch (err: any) {
      return corsError(err.message);
    }
  }

  return corsError("Method not allowed", 405);
}
