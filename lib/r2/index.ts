/**
 * Cloudflare R2 image storage helpers.
 *
 * Flow for every image upload:
 *   1. Client requests a pre-signed upload URL from /api/upload
 *   2. Server validates file type + size with Zod (imageUploadSchema)
 *   3. Client uploads raw file directly to R2 via the signed URL (no file passing through server)
 *   4. Server-side job (or edge function) compresses + WebP-converts via sharp
 *   5. Final URL stored in vehicle_images.url
 *
 * Why R2 and not Supabase Storage:
 *   Supabase Storage charges for egress. R2 has 10 GB free egress per month,
 *   which at ~200 KB per served image = ~50,000 image views free.
 *   At scale, costs are still 90% cheaper than Supabase.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

/** R2 acts as an S3-compatible store. Account ID goes in the endpoint URL. */
function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

/** Build the public-facing URL for a stored image. */
function publicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL ?? '';
  return `${base}/${key}`;
}

/** Build an R2 storage key for a vehicle image. */
export function buildImageKey(vehicleId: string | number, filename: string): string {
  // vehicles/{vehicleId}/{timestamp}-{filename}.webp
  const ts = Date.now();
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 40);
  return `vehicles/${vehicleId}/${ts}-${safe}.webp`;
}

interface CompressResult {
  buffer: Buffer;
  width: number;
  height: number;
  sizeBytes: number;
}

/**
 * Compress an image to WebP and strip EXIF data.
 * Resizes to max 1600px wide. Quality 82 gives ~80 KB for a typical car photo.
 * Strips all metadata (EXIF location, camera model) for privacy.
 */
export async function compressImage(input: Buffer): Promise<CompressResult> {
  const image = sharp(input)
    .withMetadata({ exif: {}, icc: undefined }) // strip EXIF
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 });

  const buffer = await image.toBuffer();
  const meta   = await sharp(buffer).metadata();

  return {
    buffer,
    width:     meta.width  ?? 0,
    height:    meta.height ?? 0,
    sizeBytes: buffer.length,
  };
}

/**
 * Upload a compressed image buffer directly to R2.
 * Returns the public URL.
 */
export async function uploadImage(
  key: string,
  buffer: Buffer,
  contentType = 'image/webp',
): Promise<string> {
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME!,
      Key:         key,
      Body:        buffer,
      ContentType: contentType,
      // 1 year cache — content-addressed key (timestamp in name) so safe
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return publicUrl(key);
}

/**
 * Delete an image from R2 by key.
 * Called when a vehicle is permanently deleted or seller replaces an image.
 */
export async function deleteImage(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }),
  );
}

/**
 * Generate a pre-signed PUT URL for direct browser-to-R2 upload.
 * The file never passes through our server — great for large images.
 * URL expires in 5 minutes.
 *
 * The client uses this URL, then calls /api/upload/confirm to trigger
 * server-side compression (or compression happens async via Cloudflare Worker).
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
): Promise<string> {
  const client = getR2Client();
  const command = new PutObjectCommand({
    Bucket:      process.env.R2_BUCKET_NAME!,
    Key:         key,
    ContentType: contentType,
  });
  return getSignedUrl(client, command, { expiresIn: 300 }); // 5 min
}

/**
 * Full pipeline: compress + upload + return metadata.
 * Used for server-side upload (e.g., admin tools, testing).
 * Production upload is direct: client → presigned URL → R2.
 */
export async function processAndUpload(
  rawBuffer: Buffer,
  vehicleId: string | number,
  originalFilename: string,
): Promise<{ url: string; width: number; height: number; sizeBytes: number }> {
  const compressed = await compressImage(rawBuffer);
  const key        = buildImageKey(vehicleId, originalFilename);
  const url        = await uploadImage(key, compressed.buffer);

  return { url, width: compressed.width, height: compressed.height, sizeBytes: compressed.sizeBytes };
}
