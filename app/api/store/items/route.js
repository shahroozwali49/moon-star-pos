import { connectDB } from "../../../lib/mongodb";
import Item from "../../../lib/models/Item";
import User from "../../../lib/models/User";
import Store from "../../../lib/models/Store";
import { getSession } from "../../../lib/auth";
import { cookies } from "next/headers";

async function getStore() {
  const session = await getSession();
  if (!session) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  await connectDB();
  const user = await User.findById(session.sub).lean();
  if (!user || !user.active) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  const jar = await cookies();
  const storeId = jar.get("moonstar_store")?.value;
  if (!storeId) return { error: Response.json({ error: "Select a store first" }, { status: 400 }) };
  const allowed = user.role === "SUPER_ADMIN" || (user.storeIds || []).some(id => String(id) === storeId);
  if (!allowed) return { error: Response.json({ error: "You do not have access to this store" }, { status: 403 }) };
  const store = await Store.findOne({ _id: storeId, active: true }).select("name code").lean();
  if (!store) return { error: Response.json({ error: "Store is unavailable" }, { status: 404 }) };
  return { user, store };
}

export async function GET(request) {
  const ctx = await getStore();
  if (ctx.error) return ctx.error;
  const q = new URL(request.url).searchParams.get("q")?.trim() || "";
  const filter = { active: true, ...(q ? { $or: [
    { name: { $regex: q, $options: "i" } },
    { sku: { $regex: q, $options: "i" } },
    { barcode: { $regex: q, $options: "i" } }
  ] } : {}) };
  const items = await Item.find(filter).select("name sku barcode category sellingPrice reorderLevel stockByStore").lean();
  const scoped = items.map(item => {
    const row = (item.stockByStore || []).find(x => String(x.storeId) === String(ctx.store._id));
    return { id: String(item._id), name: item.name, sku: item.sku, barcode: item.barcode, category: item.category, sellingPrice: item.sellingPrice, reorderLevel: item.reorderLevel, stock: Number(row?.quantity) || 0 };
  });
  return Response.json({ store: { id: String(ctx.store._id), name: ctx.store.name, code: ctx.store.code }, items: scoped });
}
