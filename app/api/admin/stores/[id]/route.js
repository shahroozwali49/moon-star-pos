export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import mongoose from "mongoose";
import { connectDB } from "../../../../../lib/mongodb";
import Store from "../../../../../lib/models/Store";
import { requireSuperAdmin } from "../../../../../lib/permissions";

export async function PATCH(request, { params }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid store id" }, { status: 400 });
  const body = await request.json();
  const update = {};
  for (const key of ["name", "code", "address", "contact", "logoUrl", "receiptFooter", "currencySymbol", "active", "taxEnabled"]) {
    if (body[key] !== undefined) update[key] = body[key];
  }
  if (body.taxRate !== undefined) update.taxRate = Math.max(0, Math.min(100, Number(body.taxRate) || 0));
  if (update.code) update.code = String(update.code).trim().toUpperCase();
  if (update.currencySymbol) update.currencySymbol = String(update.currencySymbol).trim().slice(0, 8);
  await connectDB();
  try {
    const store = await Store.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!store) return Response.json({ error: "Store not found" }, { status: 404 });
    return Response.json({ store });
  } catch (e) {
    return Response.json({ error: e.code === 11000 ? "Store code already exists" : "Could not update store" }, { status: 400 });
  }
}
