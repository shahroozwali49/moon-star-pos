import { connectDB } from "../../../../lib/mongodb";
import User from "../../../../lib/models/User";
import { getSession } from "../../../../lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ user: null });
  await connectDB();
  const user = await User.findById(session.sub).populate("storeIds", "name code").lean();
  if (!user || !user.active) return Response.json({ user: null });
  return Response.json({
    user: {
      id: String(user._id), name: user.name, email: user.email, role: user.role,
      stores: (user.storeIds || []).map(s => ({ id: String(s._id), name: s.name, code: s.code }))
    }
  });
}
