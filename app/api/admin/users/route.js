import bcrypt from "bcryptjs";
import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import Store from "../../../../lib/models/Store";
import { requireSuperAdmin } from "../../../../lib/permissions";

export async function GET() {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  await connectDB();
  const users = await User.find().select("-passwordHash").populate("storeIds", "name code").sort({ createdAt: -1 }).lean();
  return Response.json({ users });
}

export async function POST(request) {
  const auth = await requireSuperAdmin();
  if (auth.error) return auth.error;
  try {
    const { name, email, password, role, storeIds = [] } = await request.json();
    if (!name?.trim() || !email?.trim() || !password || password.length < 12) {
      return Response.json({ error: "Name, email, and a password of at least 12 characters are required" }, { status: 400 });
    }
    if (!["STORE_ADMIN", "CASHIER"].includes(role)) return Response.json({ error: "Invalid role" }, { status: 400 });
    await connectDB();
    const validStores = await Store.find({ _id: { $in: storeIds } }).select("_id").lean();
    if (validStores.length !== storeIds.length) return Response.json({ error: "One or more stores are invalid" }, { status: 400 });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(), email: email.trim().toLowerCase(), passwordHash, role, storeIds, active: true
    });
    return Response.json({ user: { id: String(user._id), name: user.name, email: user.email, role: user.role } }, { status: 201 });
  } catch (e) {
    return Response.json({ error: e.code === 11000 ? "Email already exists" : "Could not create user" }, { status: 400 });
  }
}
