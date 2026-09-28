/**
 * Local encryption primitives.
 *
 * Design decisions (documented for transparency, see README §Security):
 *  - Key derivation uses Node's built-in PBKDF2 (SHA-256) instead of Argon2.
 *    Reasoning: Argon2 requires a native addon which frequently fails to
 *    compile/install on ARM-based NAS systems (e.g. Fritz!NAS add-on
 *    environments, Synology, QNAP). PBKDF2 with a high iteration count
 *    (default 210,000, OWASP 2023 recommendation) ships with zero native
 *    dependencies and is FIPS-140 approved. If you deploy on a powerful
 *    x86 server and want Argon2id instead, swap `deriveKey()` below for
 *    the `argon2` package — the rest of the app is agnostic to this choice.
 *  - Field encryption uses AES-256-GCM (authenticated encryption). Every
 *    encrypted value is stored as base64("v1" || iv[12] || authTag[16] || ciphertext).
 *  - The derived data-encryption key is NEVER written to disk. It only
 *    lives in server process memory for the duration of a session (see
 *    src/lib/session.ts) and is discarded on logout / server restart.
 */
import crypto from "crypto";

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32; // 256 bit
const VERSION_PREFIX = "v1:";

export function generateSalt(bytes = 16): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/**
 * Derives a 256-bit key from the user's master password + a stored salt.
 * Used both for (a) the login password verifier and (b) the AES data key.
 * Two different salts (passwordSalt vs keySalt) MUST be used for these two
 * purposes so that the verifier hash can never be reused as the data key.
 */
export function deriveKey(
  masterPassword: string,
  saltHex: string,
  iterations = Number(process.env.PBKDF2_ITERATIONS ?? 210000)
): Buffer {
  return crypto.pbkdf2Sync(masterPassword, Buffer.from(saltHex, "hex"), iterations, KEY_LENGTH, "sha256");
}

/** Password verifier hash (safe to store in DB, cannot derive the AES key from it alone). */
export function hashPassword(masterPassword: string, saltHex: string, iterations?: number): string {
  return deriveKey(masterPassword, saltHex, iterations).toString("hex");
}

export function verifyPassword(masterPassword: string, saltHex: string, expectedHashHex: string, iterations?: number): boolean {
  const computed = hashPassword(masterPassword, saltHex, iterations);
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(expectedHashHex, "hex"));
}

/** Encrypts a UTF-8 string field with the session's AES-256 data key. */
export function encryptField(plaintext: string, key: Buffer): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, encrypted]);
  return VERSION_PREFIX + payload.toString("base64");
}

/** Decrypts a field previously produced by encryptField(). Returns null if malformed. */
export function decryptField(payload: string | null | undefined, key: Buffer): string | null {
  if (!payload) return null;
  try {
    const raw = payload.startsWith(VERSION_PREFIX) ? payload.slice(VERSION_PREFIX.length) : payload;
    const buf = Buffer.from(raw, "base64");
    const iv = buf.subarray(0, IV_LENGTH);
    const authTag = buf.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = buf.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return null; // wrong key or corrupted payload — never throw raw crypto errors to the client
  }
}

/** Encrypts an entire JSON-serializable object, used for full-database backup export. */
export function encryptJson(data: unknown, key: Buffer): string {
  return encryptField(JSON.stringify(data), key);
}

export function decryptJson<T = unknown>(payload: string, key: Buffer): T | null {
  const raw = decryptField(payload, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
