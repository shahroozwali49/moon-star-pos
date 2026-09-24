import { connectDB } from "../../../../lib/mongodb";
import Category from "../../../../lib/models/Category";
import User from "../../../../lib/models/User";
import Store from "../../../../lib/models/Store";
import { getSession } from "../../../../lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.sub).lean();
  const jar = await cookies();
  const storeId = jar.get("moonstar_store")?.value;
  if (!user?.active || !storeId) return Response.json({ error: "Select a store first" }, { status: 400 });
  if (user.role !== "SUPER_ADMIN" && !(user.storeIds || []).some(id => String(id) === storeId)) {
    return Response.json({ error: "You do not have access to this store" }, { status: 403 });
  }
  const store = await Store.findOne({ _id: storeId, active: true }).select("_id").lean();
  if (!store) return Response.json({ error: "Store is unavailable" }, { status: 404 });
  const categories = await Category.find({ storeId, active: true }).sort({ name: 1 }).lean();
  return Response.json({ categories: categories.map(c => ({ id: String(c._id), name: c.name })) });
}
