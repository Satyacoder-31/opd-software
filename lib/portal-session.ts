import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const PORTAL_COOKIE_NAME = "portal_session";
export const PORTAL_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

export type PortalSessionPayload = {
  portalAccountId: string;
  /** Legacy clinic-scoped patient context (optional) */
  patientId?: string;
  clinicId?: string;
  expiresAt: number;
};

export function portalSigningSecret() {
  return (
    process.env.PORTAL_SESSION_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    "medyx-local-portal-secret"
  );
}

export function hashOtp(code: string) {
  return createHash("sha256").update(code).digest("hex");
}

export function signPortalSession(payload: Omit<PortalSessionPayload, "expiresAt"> & { expiresAt?: number }) {
  const body: PortalSessionPayload = {
    portalAccountId: payload.portalAccountId,
    patientId: payload.patientId,
    clinicId: payload.clinicId,
    expiresAt: payload.expiresAt ?? Date.now() + PORTAL_SESSION_TTL_SECONDS * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(body)).toString("base64url");
  const signature = createHmac("sha256", portalSigningSecret())
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function parsePortalSession(token?: string): PortalSessionPayload | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", portalSigningSecret()).update(payload).digest();
  const actual = Buffer.from(signature, "base64url");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as PortalSessionPayload & {
      /** Older cookies only had patientId + clinicId */
      portalAccountId?: string;
    };
    if (data.expiresAt <= Date.now()) return null;
    if (!data.portalAccountId) {
      // Legacy session — treat as unauthenticated for new flows; portal page can re-login
      return null;
    }
    return {
      portalAccountId: data.portalAccountId,
      patientId: data.patientId,
      clinicId: data.clinicId,
      expiresAt: data.expiresAt,
    };
  } catch {
    return null;
  }
}

export async function readPortalSession() {
  const cookieStore = await cookies();
  return parsePortalSession(cookieStore.get(PORTAL_COOKIE_NAME)?.value);
}

export async function writePortalSession(
  payload: Omit<PortalSessionPayload, "expiresAt">,
) {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE_NAME, signPortalSession(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PORTAL_SESSION_TTL_SECONDS,
  });
}

export async function clearPortalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_COOKIE_NAME);
  // Also clear legacy path-scoped cookie
  cookieStore.set(PORTAL_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/portal",
    maxAge: 0,
  });
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}
