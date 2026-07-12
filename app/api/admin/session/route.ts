import {
  adminCookie,
  clearedAdminCookie,
  createAdminSession,
  secureCompare,
  verifyAdminSession,
} from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = verifyAdminSession(request);
  return Response.json({ ok: true, signedIn: Boolean(session), user: session?.sub || null });
}

export async function POST(request: Request) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPassword || !process.env.SESSION_SECRET) {
    return Response.json({ ok: false, message: "Admin credentials are not configured on the server." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  if (!secureCompare(body.username, expectedUser) || !secureCompare(body.password, expectedPassword)) {
    return Response.json({ ok: false, message: "Incorrect username or password." }, { status: 401 });
  }

  const response = Response.json({ ok: true, user: expectedUser });
  response.headers.set("Set-Cookie", adminCookie(createAdminSession(expectedUser), request));
  return response;
}

export async function DELETE(request: Request) {
  const response = Response.json({ ok: true });
  response.headers.set("Set-Cookie", clearedAdminCookie(request));
  return response;
}
