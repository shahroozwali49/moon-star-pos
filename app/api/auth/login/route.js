import bcrypt from "bcryptjs";
import { connectDB } from "../../../lib/mongodb";
import User from "../../../lib/models/User";
import { createSession, jsonError } from "../../../lib/auth";

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return jsonError("Email and password are required");
    await connectDB();

    const normalizedEmail = String(email).trim().toLowerCase();
    let user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");

    if (!user && normalizedEmail === String(process.env.SEED_ADMIN_EMAIL || "").toLowerCase()) {
      const seedPassword = process.env.SEED_ADMIN_PASSWORD;
      if (!seedPassword) return jsonError("Seed admin is not configured", 500);
      const passwordHash = await bcrypt.hash(seedPassword, 12);
      try {
        user = await User.create({
          name: process.env.SEED_ADMIN_NAME || "Super Admin",
          email: normalizedEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          active: true
        });
      } catch (e) {
        if (e.code === 11000) user = await User.findOne({ email: normalizedEmail }).select("+passwordHash");
        else throw e;
      }
    }

    if (!user || !user.active) return jsonError("Invalid credentials", 401);
    const valid = await bcrypt.compare(String(password), user.passwordHash);
    if (!valid) return jsonError("Invalid credentials", 401);

    await createSession(user);
    return Response.json({
      user: { id: String(user._id), name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error("Login error:", error);
    return jsonError("Unable to sign in. Check server configuration.", 500);
  }
}
