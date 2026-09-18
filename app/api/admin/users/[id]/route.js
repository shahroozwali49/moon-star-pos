import mongoose from "mongoose";
import { connectDB } from "../../../../../lib/mongodb";
import User from "../../../../../lib/models/User";
import Store from "../../../../../lib/models/Store";
import { requireSuperAdmin } from "../../../../../lib/permissions";

export async function PATCH(request, { params }) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid user id" }, { status: 400 });
  const body = await request.json();
  const update = {};
  for (const key of ["name", "active"]) if (body[key] !== undefined) update[key] = body[key];
  if (body.role !== undefined) {
    if (!["STORE_ADMIN", "CASHIER"].includes(body.role)) return Response.json({ error: "Invalid role" }, { status: 400 });
    update.role = body.role;
  }
  if (body.storeIds !== undefined) {
    await connectDB();
    const stores = await Store.find({ _id: { $in: body.storeIds } }).select("_id").lean();
    if (stores.length !== body.storeIds.length) return Response.json({ error: "One or more stores are invalid" }, { status: 400 });
    update.storeIds = body.storeIds;
  } else await connectDB();
  const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select("-passwordHash");
  if (!user) return Response.json({ error: "User not found" }, { status: 404 });
  return Response.json({ user });
}
