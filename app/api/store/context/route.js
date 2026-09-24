export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { connectDB } from "../../../lib/mongodb";
import User from "../../../lib/models/User";
import Store from "../../../lib/models/Store";
import { getSession } from "../../../lib/auth";
import { cookies } from "next/headers";

function publicStore(s) {
  return {
    id: String(s._id),
    name: s.name,
    code: s.code,
    address: s.address || "",
    contact: s.contact || "",
    receiptFooter: s.receiptFooter || "",
    currencySymbol: s.currencySymbol || "PKR",
    taxEnabled: Boolean(s.taxEnabled),
    taxRate: Number(s.taxRate) || 0
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.sub).populate("storeIds", "name code address contact receiptFooter currencySymbol taxEnabled taxRate active").lean();
  if (!user || !user.active) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const stores = user.role === "SUPER_ADMIN"
    ? await Store.find({ active: true }).select("name code address contact receiptFooter currencySymbol taxEnabled taxRate active").sort({ name: 1 }).lean()
    : (user.storeIds || []).filter(s => s.active);
  return Response.json({ stores: stores.map(publicStore) });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { storeId } = await request.json();
  if (!storeId) return Response.json({ error: "Store is required" }, { status: 400 });
  await connectDB();
  const user = await User.findById(session.sub).lean();
  if (!user || !user.active) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const allowed = user.role === "SUPER_ADMIN" || (user.storeIds || []).some(id => String(id) === String(storeId));
  if (!allowed) return Response.json({ error: "You do not have access to this store" }, { status: 403 });
  const store = await Store.findOne({ _id: storeId, active: true }).select("name code address contact receiptFooter currencySymbol taxEnabled taxRate").lean();
  if (!store) return Response.json({ error: "Store is unavailable" }, { status: 404 });
  const response = Response.json({ store: publicStore(store) });
  response.headers.append("Set-Cookie", "moonstar_store=" + String(store._id) + "; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800");
  return response;
}
