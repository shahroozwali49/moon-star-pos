export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import mongoose from "mongoose";
import { connectDB } from "../../../../../lib/mongodb";
import HeldSale from "../../../../../lib/models/HeldSale";
import User from "../../../../../lib/models/User";
import { getSession } from "../../../../../lib/auth";
import { cookies } from "next/headers";

async function context() {
  const session = await getSession();
  if (!session) return null;
  await connectDB();
  const user = await User.findById(session.sub).lean();
  const jar = await cookies();
  const storeId = jar.get("moonstar_store")?.value;
  if (!user?.active || !storeId) return null;
  if (user.role !== "SUPER_ADMIN" && !(user.storeIds || []).some(id => String(id) === storeId)) return null;
  return { user, storeId };
}

export async function DELETE(request, { params }) {
  const ctx = await context();
  if (!ctx) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!mongoose.isValidObjectId(id)) return Response.json({ error: "Invalid held sale id" }, { status: 400 });
  const result = await HeldSale.deleteOne({ _id: id, storeId: ctx.storeId });
  if (!result.deletedCount) return Response.json({ error: "Held sale not found" }, { status: 404 });
  return Response.json({ ok: true });
}
