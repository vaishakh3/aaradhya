import { requireAdminSession } from "../../../../lib/admin-auth";
import {
  createStoredProduct,
  deleteStoredProduct,
  getStoredProducts,
  reorderStoredProducts,
  updateStoredProduct,
} from "../../../../lib/product-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const failure = (error: unknown) => {
  const message = error instanceof Error ? error.message : "The request could not be completed.";
  return Response.json({ ok: false, message }, { status: 400 });
};

export async function GET(request: Request) {
  const auth = requireAdminSession(request);
  if (auth.response) return auth.response;
  try {
    return Response.json({ ok: true, ...(await getStoredProducts({ includeInactive: true })) });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  const auth = requireAdminSession(request);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    return Response.json({ ok: true, product: await createStoredProduct(body.product || {}) });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    return Response.json({ ok: true, product: await updateStoredProduct(body.id, body.product || {}) });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request) {
  const auth = requireAdminSession(request);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    return Response.json({ ok: true, products: await reorderStoredProducts(body.orderedIds || []) });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(request: Request) {
  const auth = requireAdminSession(request);
  if (auth.response) return auth.response;
  try {
    const body = await request.json();
    return Response.json({ ok: true, product: await deleteStoredProduct(body.id) });
  } catch (error) {
    return failure(error);
  }
}
