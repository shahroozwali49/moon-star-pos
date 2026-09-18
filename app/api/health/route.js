import { connectDB } from "../../lib/mongodb";

export async function GET() {
  try {
    await connectDB();
    return Response.json({ ok: true, database: "connected" });
  } catch {
    return Response.json({ ok: false, database: "unavailable" }, { status: 503 });
  }
}
