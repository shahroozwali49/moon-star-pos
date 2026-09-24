import { connectDB } from "../../../lib/mongodb";
import Category from "../../../lib/models/Category";
import { requireSuperAdmin } from "../../../lib/permissions";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const categories = await Category.find({ active: true }).sort({ name: 1 }).lean();
  return Response.json({ categories });
}

export async function POST(request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  try {
    const { name } = await request.json();
    if (!name?.trim()) return Response.json({ error: "Category name is required" }, { status: 400 });
    await connectDB();
    const category = await Category.create({ name: name.trim(), active: true });
    return Response.json({ category }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.code === 11000 ? "Category already exists" : "Could not create category" }, { status: 400 });
  }
}
