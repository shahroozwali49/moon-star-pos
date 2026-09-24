export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { connectDB } from "../../../../../lib/mongodb";
import Sale from "../../../../../lib/models/Sale";
import HeldSale from "../../../../../lib/models/HeldSale";
import User from "../../../../../lib/models/User";
import Store from "../../../../../lib/models/Store";
import { getSession } from "../../../../../lib/auth";
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

export async function GET(request) {
  const ctx = await getContext();
  if (ctx.error) return ctx.error;

  const params = new URL(request.url).searchParams;
  const status = params.get("status") || "PAID";
  const from = params.get("from");
  const to = params.get("to");
  const cashierId = params.get("cashierId");
  const tillNumber = params.get("tillNumber");

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from + "T00:00:00");
  if (to) dateFilter.$lte = new Date(to + "T23:59:59.999");

  const base = {
    storeId: ctx.store._id,
    ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {})
  };
  if (cashierId) base.cashierId = cashierId;
  if (tillNumber) base.tillNumber = tillNumber;

  const paidPromise = status === "HELD"
    ? Promise.resolve([])
    : Sale.find(base).populate("cashierId", "name").populate("customerId", "name phone").sort({ createdAt: -1 }).limit(200).lean();
  const heldPromise = status === "PAID"
    ? Promise.resolve([])
    : HeldSale.find(base).populate("cashierId", "name").populate("customerId", "name phone").sort({ createdAt: -1 }).limit(200).lean();

  const [paid, held, cashiers] = await Promise.all([
    paidPromise,
    heldPromise,
    User.find({ active: true, storeIds: ctx.store._id }).select("name email").sort({ name: 1 }).lean()
  ]);

  const rows = [
    ...(paid || []).map(s => ({
      id: String(s._id),
      status: "PAID",
      saleNumber: s.saleNumber,
      cashier: s.cashierId?.name || "",
      customer: s.customerId?.name || "Walk-in",
      tillNumber: s.tillNumber || "1",
      subtotal: s.subtotal,
      discount: s.discount,
      tax: s.tax,
      total: s.total,
      paymentMethod: s.paymentMethod,
      tenderedAmount: s.tenderedAmount,
      changeAmount: s.changeAmount,
      createdAt: s.createdAt
    })),
    ...(held || []).map(s => ({
      id: String(s._id),
      status: "HELD",
      saleNumber: "HOLD-" + String(s._id).slice(-6).toUpperCase(),
      cashier: s.cashierId?.name || "",
      customer: s.customerId?.name || "Walk-in",
      tillNumber: s.tillNumber || "1",
      subtotal: s.subtotal,
      discount: s.discount,
      tax: s.tax,
      total: s.total,
      paymentMethod: "—",
      tenderedAmount: 0,
      changeAmount: 0,
      createdAt: s.createdAt
    }))
  ];

  rows.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return Response.json({
    rows: rows.slice(0, 200),
    cashiers: cashiers.map(u => ({ id: String(u._id), name: u.name, email: u.email }))
  });
}
