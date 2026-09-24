import { connectDB } from "../../../../lib/mongodb";
import HeldSale from "../../../../lib/models/HeldSale";
import User from "../../../../lib/models/User";
import Store from "../../../../lib/models/Store";
import { getSession } from "../../../../lib/auth";
import { cookies } from "next/headers";

async function getContext() {
  const session = await getSession();
  if (!session) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  await connectDB();
  const user = await User.findById(session.sub).lean();
  const jar = await cookies();
  const storeId = jar.get("moonstar_store")?.value;
  if (!user?.active || !storeId) return { error: Response.json({ error: "Select a store first" }, { status: 400 }) };
  if (user.role !== "SUPER_ADMIN" && !(user.storeIds || []).some(id => String(id) === storeId)) {
    return { error: Response.json({ error: "You do not have access to this store" }, { status: 403 }) };
  }
  const store = await Store.findOne({ _id: storeId, active: true }).select("_id").lean();
  if (!store) return { error: Response.json({ error: "Store is unavailable" }, { status: 404 }) };
  return { user, store };
}

export async function GET() {
  const ctx = await getContext();
  if (ctx.error) return ctx.error;
  const held = await HeldSale.find({ storeId: ctx.store._id }).populate("customerId", "name phone").populate("cashierId", "name").sort({ createdAt: -1 }).lean();
  return Response.json({ held: held.map(h => ({ ...h, id: String(h._id), storeId: String(h.storeId), customer: h.customerId ? { id: String(h.customerId._id), name: h.customerId.name, phone: h.customerId.phone } : null, cashier: h.cashierId?.name || "" })) });
}

export async function POST(request) {
  const ctx = await getContext();
  if (ctx.error) return ctx.error;
  try {
    const body = await request.json();
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (!lines.length) return Response.json({ error: "Cart is empty" }, { status: 400 });
    const hold = await HeldSale.create({
      storeId: ctx.store._id,
      cashierId: ctx.user._id,
      tillNumber: String(body.tillNumber || "1").trim(),
      customerId: body.customerId || null,
      lines,
      subtotal: Number(body.subtotal) || 0,
      discount: Number(body.discount) || 0,
      tax: Number(body.tax) || 0,
      total: Number(body.total) || 0
    });
    return Response.json({ held: { id: String(hold._id) } }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not hold sale" }, { status: 400 });
  }
}
