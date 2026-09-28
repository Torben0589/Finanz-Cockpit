import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { deriveKey, generateSalt, hashPassword, verifyPassword } from "@/lib/crypto";
import { createSession, destroySession, getSession, SESSION_COOKIE } from "@/lib/session";

export class AuthError extends Error {}

/** First-run setup: creates the single local user + master password. */
export async function setupMasterPassword(username: string, masterPassword: string) {
  const existing = await prisma.user.findFirst();
  if (existing) throw new AuthError("Setup already completed.");

  const passwordSalt = generateSalt();
  const keySalt = generateSalt();
  const iterations = Number(process.env.PBKDF2_ITERATIONS ?? 210000);
  const passwordHash = hashPassword(masterPassword, passwordSalt, iterations);

  const user = await prisma.user.create({
    data: { username, passwordHash, passwordSalt, keySalt, pbkdf2Iterations: iterations }
  });

  return login(username, masterPassword, user.id);
}

export async function login(username: string, masterPassword: string, knownUserId?: string) {
  const user = knownUserId
    ? await prisma.user.findUnique({ where: { id: knownUserId } })
    : await prisma.user.findUnique({ where: { username } });

  if (!user) throw new AuthError("Invalid username or password.");

  const valid = verifyPassword(masterPassword, user.passwordSalt, user.passwordHash, user.pbkdf2Iterations);
  if (!valid) throw new AuthError("Invalid username or password.");

  const dataKey = deriveKey(masterPassword, user.keySalt, user.pbkdf2Iterations);
  const sessionId = createSession(user.id, user.username, dataKey);

  cookies().set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Number(process.env.SESSION_TTL_MINUTES ?? 60) * 60
  });

  return { userId: user.id, username: user.username };
}

export function logout() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  destroySession(sessionId);
  cookies().delete(SESSION_COOKIE);
}

/** Throws if there is no valid session — use at the top of every protected API route. */
export function requireSession() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  const session = getSession(sessionId);
  if (!session) throw new AuthError("Not authenticated.");
  return session;
}

export function getSessionOrNull() {
  const sessionId = cookies().get(SESSION_COOKIE)?.value;
  return getSession(sessionId);
}

export async function isFirstRun(): Promise<boolean> {
  const count = await prisma.user.count();
  return count === 0;
}
