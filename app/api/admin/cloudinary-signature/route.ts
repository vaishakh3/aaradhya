import { requireAdminSession } from "../../../../lib/admin-auth";
import { signCloudinaryUpload } from "../../../../lib/product-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth.response) return auth.response;
  try {
    return Response.json({ ok: true, ...signCloudinaryUpload() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cloudinary could not be prepared.";
    return Response.json({ ok: false, message }, { status: 503 });
  }
}
