/**
 * Cloudflare R2 image storage helpers.
 */

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';

function getR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    // CRITICAL: disable AWS's default CRC32 checksum which R2 rejects
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

function publicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL ?? '';
  return `${base}/${key}`;
}

export function buildImageKey(vehicleId: string | number, filename: string): string {
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

export async function compressImage(input: Buffer): Promise<CompressResult> {
  const image = sharp(input)
    .withMetadata({ exif: {}, icc: undefined })
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

export async function uploadImage(
  key: string,
  buffer: Buffer,
  contentType = 'image/webp',
): Promise<string> {
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket:        process.env.R2_BUCKET_NAME!,
      Key:           key,
      Body:          buffer,
      ContentType:   contentType,
      CacheControl:  'public, max-age=31536000, immutable',
    }),
  );

  return publicUrl(key);
}

export async function deleteImage(key: string): Promise<void> {
  const client = getR2Client();
  await client.send(
    new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET_NAME!, Key: key }),
  );
}

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
  return getSignedUrl(client, command, { expiresIn: 300 });
}

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