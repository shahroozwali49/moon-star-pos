import { getSession, jsonError } from "./auth";

export async function requireSuperAdmin() {
  const session = await getSession();
  if (!session) return { error: jsonError("Unauthorized", 401) };
  if (session.role !== "SUPER_ADMIN") return { error: jsonError("Forbidden", 403) };
  return { session };
}
