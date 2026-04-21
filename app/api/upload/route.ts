// POST /api/upload
// Accepts multipart/form-data with a single `file` field (an image),
// uploads it to Cloudinary, and returns { url, publicId }.
// Store the returned URL in REPORT.Photo_URL.

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-helpers";
import { uploadBufferToCloudinary } from "@/lib/cloudinary";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export const runtime = "nodejs"; // Cloudinary SDK needs Node, not Edge.

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided. Use multipart/form-data with a `file` field." },
      { status: 400 },
    );
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only images are allowed." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await uploadBufferToCloudinary(buffer);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[upload] Cloudinary error:", err);
    return NextResponse.json(
      { error: "Image upload failed. Please try again." },
      { status: 500 },
    );
  }
}
