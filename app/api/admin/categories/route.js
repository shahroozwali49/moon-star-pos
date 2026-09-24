import { connectDB } from "../../../../lib/mongodb";
import Category from "../../../../lib/models/Category";
import Store from "../../../../lib/models/Store";
import { requireSuperAdmin } from "../../../../lib/permissions";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const categories = await Category.find().populate("storeId", "name code").sort({ name: 1 }).lean();
  return Response.json({ categories });
}

export async function POST(request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  try {
    const { storeId, name } = await request.json();
    if (!storeId || !name?.trim()) return Response.json({ error: "Store and category name are required" }, { status: 400 });
    await connectDB();
    const store = await Store.findById(storeId).select("_id").lean();
    if (!store) return Response.json({ error: "Store not found" }, { status: 404 });
    const category = await Category.create({ storeId, name: name.trim(), active: true });
    return Response.json({ category }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.code === 11000 ? "Category already exists for this store" : "Could not create category" }, { status: 400 });
  }
}
