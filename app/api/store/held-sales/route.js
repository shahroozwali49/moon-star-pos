import { connectDB } from "../../../lib/mongodb";
import HeldSale from "../../../lib/models/HeldSale";
import Item from "../../../lib/models/Item";
import Customer from "../../../lib/models/Customer";
import User from "../../../lib/models/User";
import Store from "../../../lib/models/Store";
import { getSession } from "../../../lib/auth";
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
  const store = await Store.findOne({ _id: storeId, active: true }).lean();
  if (!store) return { error: Response.json({ error: "Store is unavailable" }, { status: 404 }) };
  return { user, store };
}

export async function GET() {
  const ctx = await getContext();
  if (ctx.error) return ctx.error;
  const held = await HeldSale.find({ storeId: ctx.store._id })
    .populate("customerId", "name phone")
    .populate("cashierId", "name")
    .sort({ createdAt: -1 })
    .lean();
  return Response.json({
    held: held.map(h => ({
      ...h,
      id: String(h._id),
      storeId: String(h.storeId),
      customer: h.customerId ? { id: String(h.customerId._id), name: h.customerId.name, phone: h.customerId.phone } : null,
      cashier: h.cashierId?.name || ""
    }))
  });
}

export async function POST(request) {
  const ctx = await getContext();
  if (ctx.error) return ctx.error;
  try {
    const body = await request.json();
    const input = Array.isArray(body.lines) ? body.lines : [];
    if (!input.length) return Response.json({ error: "Cart is empty" }, { status: 400 });

    if (body.customerId) {
      const customer = await Customer.findOne({ _id: body.customerId, storeId: ctx.store._id, active: true }).select("_id").lean();
      if (!customer) return Response.json({ error: "Customer is not valid for this store" }, { status: 400 });
    }

    const items = await Item.find({ _id: { $in: input.map(x => x.itemId) }, active: true }).lean();
    const map = new Map(items.map(i => [String(i._id), i]));
    const lines = [];
    let subtotal = 0;

    for (const line of input) {
      const item = map.get(String(line.itemId));
      const quantity = Math.floor(Number(line.quantity));
      if (!item || !Number.isInteger(quantity) || quantity < 1) return Response.json({ error: "Invalid held sale item" }, { status: 400 });
      const row = (item.stockByStore || []).find(x => String(x.storeId) === String(ctx.store._id));
      if (!row || row.quantity < quantity) return Response.json({ error: "Insufficient stock for " + item.name }, { status: 400 });
      subtotal += item.sellingPrice * quantity;
      lines.push({
        itemId: item._id,
        name: item.name,
        sku: item.sku,
        quantity,
        unitPrice: item.sellingPrice,
        lineTotal: item.sellingPrice * quantity
      });
    }

    const discount = Math.min(Math.max(Number(body.discount) || 0, 0), subtotal);
    const taxable = subtotal - discount;
    const tax = ctx.store.taxEnabled ? Math.round(taxable * (Number(ctx.store.taxRate) || 0) / 100 * 100) / 100 : 0;
    const total = Math.round((taxable + tax) * 100) / 100;

    const hold = await HeldSale.create({
      storeId: ctx.store._id,
      cashierId: ctx.user._id,
      tillNumber: String(body.tillNumber || "1").trim().slice(0, 30),
      customerId: body.customerId || null,
      lines,
      subtotal,
      discount,
      tax,
      total
    });

    return Response.json({ held: { id: String(hold._id), total: hold.total } }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not hold sale" }, { status: 400 });
  }
}
