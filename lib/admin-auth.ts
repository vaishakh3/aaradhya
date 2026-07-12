import crypto from "node:crypto";

export const ADMIN_COOKIE = "aaradhya_admin_session";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 12;

type AdminSession = {
  sub: string;
  exp: number;
};

const sign = (payload: string) =>
  crypto
    .createHmac("sha256", process.env.SESSION_SECRET || "local-development-only")
    .update(payload)
    .digest("base64url");

export const secureCompare = (left: unknown, right: unknown) => {
  const leftBuffer = Buffer.from(String(left ?? ""));
  const rightBuffer = Buffer.from(String(right ?? ""));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

export const createAdminSession = (username: string) => {
  const payload = Buffer.from(
    JSON.stringify({ sub: username, exp: Date.now() + ADMIN_SESSION_SECONDS * 1000 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

export const verifyAdminSession = (request: Request): AdminSession | null => {
  try {
    const cookie = request.headers
      .get("cookie")
      ?.split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${ADMIN_COOKIE}=`));
    const token = cookie ? decodeURIComponent(cookie.slice(ADMIN_COOKIE.length + 1)) : "";
    const [payload, signature] = token.split(".");
    if (!payload || !signature) return null;

    const expected = sign(payload);
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length) return null;
    if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;

    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as AdminSession;
    if (!session.sub || !session.exp || Date.now() > session.exp) return null;
    return session;
  } catch {
    return null;
  }
};

export const requireAdminSession = (request: Request) => {
  const session = verifyAdminSession(request);
  if (!session) {
    return {
      session: null,
      response: Response.json({ ok: false, message: "Please sign in again." }, { status: 401 }),
    };
  }
  return { session, response: null };
};

export const adminCookie = (token: string, request: Request) => {
  const secure = new URL(request.url).protocol === "https:" || process.env.NODE_ENV === "production";
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_SESSION_SECONDS}${secure ? "; Secure" : ""}`;
};

export const clearedAdminCookie = (request: Request) => {
  const secure = new URL(request.url).protocol === "https:" || process.env.NODE_ENV === "production";
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`;
};
