import { connectDB } from "../../lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    return Response.json({
      ok: true,
      database: "connected",
    });
  } catch (error) {
    console.error("MongoDB health check failed:", error);

    return Response.json(
      {
        ok: false,
        database: "unavailable",
        error:
          process.env.NODE_ENV === "production"
            ? "MongoDB connection failed. Check Vercel MONGODB_URI and MongoDB Atlas Network Access."
            : error?.message || "MongoDB connection failed",
      },
      { status: 503 }
    );
  }
}
