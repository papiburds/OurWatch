// ─────────────────────────────────────────────────────────────────────────────
// Cloudinary server-side client.
// This runs only inside API routes (never in the browser). The API_SECRET
// must never be exposed client-side.
// ─────────────────────────────────────────────────────────────────────────────

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

// Uploads a file buffer to Cloudinary and returns its URL.
// Uses `upload_stream` so we can pipe a Buffer without touching disk.
export function uploadBufferToCloudinary(
  buffer: Buffer,
  folder = "ourwatch/reports",
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err || !result) return reject(err ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );
    stream.end(buffer);
  });
}
