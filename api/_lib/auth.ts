import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "evolv-dev-secret-change-me");
const ISSUER = "evolv-studio";
const AUDIENCE = "evolv-admin";

export interface JWTPayload {
  sub: string;       // admin user id
  email: string;
  role: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return payload as unknown as JWTPayload;
}

export function extractToken(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function requireAdmin(req: Request): Promise<JWTPayload> {
  const token = extractToken(req);
  if (!token) throw new Error("Unauthorized");
  const payload = await verifyToken(token);
  if (payload.role !== "admin") throw new Error("Forbidden");
  return payload;
}
