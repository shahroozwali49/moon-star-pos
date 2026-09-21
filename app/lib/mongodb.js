import mongoose from "mongoose";

let cached = globalThis.mongooseCache;
if (!cached) cached = globalThis.mongooseCache = { conn: null, promise: null };

export async function connectDB() {
  // Check for MONGODB_URI only when actually connecting (runtime)
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  if (cached.conn) return cached.conn;
  
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}
