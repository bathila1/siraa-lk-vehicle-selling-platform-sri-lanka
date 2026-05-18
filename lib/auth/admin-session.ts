import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'siraa_admin_session';
const SESSION_TTL_HOURS = 8;

export interface AdminSessionPayload {
  admin_id: string;
  phone: string;
  role: 'super_admin' | 'moderator';
  [key: string]: unknown;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET env var must be at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export async function setAdminSession(payload: AdminSessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_HOURS}h`)
    .sign(getSecret());

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_HOURS * 60 * 60,
  });
}

export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function requireAdmin(): Promise<AdminSessionPayload> {
  const s = await getAdminSession();
  if (!s) throw new Error('Unauthorized');
  return s;
}
