import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'siraa_session';
// const SESSION_TTL_DAYS = 30;
const SESSION_TTL_DAYS = 90;


interface SessionPayload {
  seller_id: string;
  phone: string;
  is_admin?: boolean;
  [key: string]: unknown;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

/** Sign and set a session cookie for the given seller. */
export async function setSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

/** Read and verify the session from the cookie. Returns null if missing or invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Clear the session cookie. */
export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/** Require a valid session — throws (redirected by caller) if missing. */
export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error('Unauthorized');
  return s;
}
