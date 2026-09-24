import { connectDB } from "../../../../lib/mongodb";
import Customer from "../../../../lib/models/Customer";
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
  const store = await Store.findOne({ _id: storeId, active: true }).select("_id name code").lean();
  if (!store) return { error: Response.json({ error: "Store is unavailable" }, { status: 404 }) };
  return { user, store };
}

export async function GET(request) {
  const ctx = await getContext();
  if (ctx.error) return ctx.error;
  const q = new URL(request.url).searchParams.get("q")?.trim() || "";
  const filter = { storeId: ctx.store._id, active: true };
  if (q) filter.$or = [
    { name: { $regex: q, $options: "i" } },
    { phone: { $regex: q, $options: "i" } },
    { email: { $regex: q, $options: "i" } }
  ];
  const customers = await Customer.find(filter).sort({ name: 1 }).limit(50).lean();
  return Response.json({ customers });
}

export async function POST(request) {
  const ctx = await getContext();
  if (ctx.error) return ctx.error;
  try {
    const { name, phone = "", email = "", notes = "" } = await request.json();
    if (!name?.trim()) return Response.json({ error: "Customer name is required" }, { status: 400 });
    const customer = await Customer.create({ storeId: ctx.store._id, name: name.trim(), phone: String(phone).trim(), email: String(email).trim(), notes: String(notes).trim(), active: true });
    return Response.json({ customer }, { status: 201 });
  } catch {
    return Response.json({ error: "Could not create customer" }, { status: 400 });
  }
}
