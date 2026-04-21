// GET /api/me — returns the currently logged-in AppUser, or 401.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-helpers";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  return NextResponse.json(user);
}
