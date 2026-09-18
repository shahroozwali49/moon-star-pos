import { connectDB } from "../../../../lib/mongodb";
import Store from "../../../lib/models/Store";
import { requireSuperAdmin } from "../../../../lib/permissions";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const stores = await Store.find().sort({ createdAt: -1 }).lean();
  return Response.json({ stores });
}

export async function POST(request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  try {
    const { name, code, address = "" } = await request.json();
    if (!name?.trim() || !code?.trim()) return Response.json({ error: "Store name and code are required" }, { status: 400 });
    await connectDB();
    const store = await Store.create({ name: name.trim(), code: code.trim().toUpperCase(), address });
    return Response.json({ store }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.code === 11000 ? "Store code already exists" : "Could not create store" }, { status: 400 });
  }
}
