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
  for (const key of ["name", "code", "address", "active"]) if (body[key] !== undefined) update[key] = body[key];
  await connectDB();
  const store = await Store.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  if (!store) return Response.json({ error: "Store not found" }, { status: 404 });
  return Response.json({ store });
}
