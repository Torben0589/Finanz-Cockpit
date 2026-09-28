/**
 * In-memory session store.
 *
 * The derived AES-256 data-encryption key must NEVER touch disk. We keep a
 * process-local Map<sessionId, SessionRecord> instead of a JWT/DB session,
 * so the key only exists in RAM for as long as the Node process runs and is
 * wiped immediately on logout or process restart. This is an intentional
 * trade-off for a local-first, single-process, single-user (or small
 * family) deployment — see README §Security for the multi-worker caveat.
 */
import crypto from "crypto";

interface SessionRecord {
  userId: string;
  username: string;
  dataKey: Buffer;
  expiresAt: number;
}

const SESSION_COOKIE_NAME = "finance_cockpit_session";
const store = new Map<string, SessionRecord>();

function ttlMs(): number {
  const minutes = Number(process.env.SESSION_TTL_MINUTES ?? 60);
  return minutes * 60 * 1000;
}

export function createSession(userId: string, username: string, dataKey: Buffer): string {
  const sessionId = crypto.randomBytes(32).toString("hex");
  store.set(sessionId, { userId, username, dataKey, expiresAt: Date.now() + ttlMs() });
  return sessionId;
}

export function getSession(sessionId: string | undefined | null): SessionRecord | null {
  if (!sessionId) return null;
  const record = store.get(sessionId);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    store.delete(sessionId);
    return null;
  }
  // sliding expiration
  record.expiresAt = Date.now() + ttlMs();
  return record;
}

export function destroySession(sessionId: string | undefined | null): void {
  if (sessionId) store.delete(sessionId);
}

export function isSetupComplete(): boolean {
  return true; // determined by DB (User row exists) — see auth service
}

export const SESSION_COOKIE = SESSION_COOKIE_NAME;
