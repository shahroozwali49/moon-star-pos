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
        diagnostic: {
          errorName: error?.name || "UnknownError",
          errorCode: error?.code ?? null,
          errorCodeName: error?.codeName ?? null,
          message:
            process.env.NODE_ENV === "production"
              ? "MongoDB connection failed. Sensitive connection details are intentionally hidden."
              : error?.message || "MongoDB connection failed",
        },
      },
      { status: 503 }
    );
  }
}
