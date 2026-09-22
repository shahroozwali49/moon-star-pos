import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import Store from "../../../../lib/models/Store";
import { getSession } from "../../../../lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.sub).populate("storeIds", "name code active").lean();
  if (!user || !user.active) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const stores = user.role === "SUPER_ADMIN"
    ? await Store.find({ active: true }).select("name code active").sort({ name: 1 }).lean()
    : (user.storeIds || []).filter(s => s.active);
  return Response.json({ stores: stores.map(s => ({ id: String(s._id), name: s.name, code: s.code })) });
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
  const store = await Store.findOne({ _id: storeId, active: true }).select("name code").lean();
  if (!store) return Response.json({ error: "Store is unavailable" }, { status: 404 });
  const response = Response.json({ store: { id: String(store._id), name: store.name, code: store.code } });
  response.headers.append("Set-Cookie", `moonstar_store=${String(store._id)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`);
  return response;
}
