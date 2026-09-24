export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import mongoose from "mongoose";
import { connectDB } from "../../../../lib/mongodb";
import Item from "../../../../lib/models/Item";
import User from "../../../../lib/models/User";
import Store from "../../../../lib/models/Store";
import Sale from "../../../../lib/models/Sale";
import Customer from "../../../../lib/models/Customer";
import { getSession } from "../../../../lib/auth";
import { cookies } from "next/headers";

export async function POST(request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { lines = [], paymentMethod = "CASH", discount = 0, tenderedAmount = 0, customerId = null, tillNumber = "1" } = body;
  if (!Array.isArray(lines) || !lines.length) return Response.json({ error: "Cart is empty" }, { status: 400 });
  if (!["CASH", "CARD", "OTHER"].includes(paymentMethod)) return Response.json({ error: "Invalid payment method" }, { status: 400 });

  await connectDB();
  const user = await User.findById(session.sub).lean();
  const jar = await cookies();
  const storeId = jar.get("moonstar_store")?.value;
  if (!user?.active || !storeId) return Response.json({ error: "Select a store first" }, { status: 400 });
  if (user.role !== "SUPER_ADMIN" && !(user.storeIds || []).some(id => String(id) === storeId)) {
    return Response.json({ error: "You do not have access to this store" }, { status: 403 });
  }

  const store = await Store.findOne({ _id: storeId, active: true }).lean();
  if (!store) return Response.json({ error: "Store is unavailable" }, { status: 404 });

  if (customerId) {
    const customer = await Customer.findOne({ _id: customerId, storeId, active: true }).select("_id").lean();
    if (!customer) return Response.json({ error: "Customer is not valid for this store" }, { status: 400 });
  }

  const sessionDb = await mongoose.startSession();
  try {
    let result;
    await sessionDb.withTransaction(async () => {
      const ids = lines.map(x => x.itemId);
      const items = await Item.find({ _id: { $in: ids }, active: true }).session(sessionDb);
      const map = new Map(items.map(i => [String(i._id), i]));
      const normalized = [];

      for (const line of lines) {
        const item = map.get(String(line.itemId));
        const qty = Math.floor(Number(line.quantity));
        if (!item || !Number.isInteger(qty) || qty < 1) throw new Error("Invalid cart item");
        const row = (item.stockByStore || []).find(x => String(x.storeId) === storeId);
        if (!row || row.quantity < qty) throw new Error("Insufficient stock for " + item.name);
        normalized.push({ item, qty });
      }

      let subtotal = 0;
      for (const { item, qty } of normalized) {
        subtotal += item.sellingPrice * qty;
        const updated = await Item.updateOne(
          { _id: item._id, "stockByStore": { $elemMatch: { storeId, quantity: { $gte: qty } } } },
          { $inc: { "stockByStore.$.quantity": -qty } },
          { session: sessionDb }
        );
        if (updated.modifiedCount !== 1) throw new Error("Stock changed for " + item.name + "; please retry");
      }

      const safeDiscount = Math.min(Math.max(Number(discount) || 0, 0), subtotal);
      const taxableAmount = subtotal - safeDiscount;
      const tax = store.taxEnabled ? Math.round(taxableAmount * (Number(store.taxRate) || 0) / 100 * 100) / 100 : 0;
      const total = Math.round((taxableAmount + tax) * 100) / 100;
      const tendered = paymentMethod === "CARD" ? total : Math.max(0, Number(tenderedAmount) || 0);
      if (tendered < total) throw new Error("Tendered amount is less than the total");
      const change = Math.round((tendered - total) * 100) / 100;
      const saleNumber = "MS-" + Date.now() + "-" + Math.floor(Math.random() * 1000).toString().padStart(3, "0");

      const sale = await Sale.create([{
        saleNumber,
        storeId,
        cashierId: user._id,
        tillNumber: String(tillNumber || "1").trim().slice(0, 30),
        customerId: customerId || null,
        lines: normalized.map(({ item, qty }) => ({
          itemId: item._id,
          name: item.name,
          sku: item.sku,
          quantity: qty,
          unitPrice: item.sellingPrice,
          lineTotal: item.sellingPrice * qty
        })),
        subtotal,
        discount: safeDiscount,
        tax,
        total,
        paymentMethod,
        tenderedAmount: tendered,
        changeAmount: change
      }], { session: sessionDb });

      result = sale[0];
    });

    return Response.json({
      sale: {
        id: String(result._id),
        saleNumber: result.saleNumber,
        subtotal: result.subtotal,
        discount: result.discount,
        tax: result.tax,
        total: result.total,
        paymentMethod: result.paymentMethod,
        tenderedAmount: result.tenderedAmount,
        changeAmount: result.changeAmount,
        customerId: result.customerId ? String(result.customerId) : null
      }
    }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.message || "Could not complete sale" }, { status: 400 });
  } finally {
    await sessionDb.endSession();
  }
}
