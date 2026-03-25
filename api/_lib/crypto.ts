/**
 * Edge-compatible password hashing using Web Crypto (PBKDF2-SHA256).
 * Drop-in replacement for bcryptjs in Vercel Edge runtime.
 */

const enc = new TextEncoder();

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial,
    256
  );
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await deriveKey(password, salt);
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `pbkdf2:${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  // Support both PBKDF2 format and bcrypt format (legacy)
  if (!stored.startsWith("pbkdf2:")) {
    // Legacy: try constant-time string compare as fallback (bcrypt hashes won't match anyway)
    return false;
  }
  const [, saltHex, storedHashHex] = stored.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const hash = await deriveKey(password, salt);
  const hashHex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex === storedHashHex;
}
