import sharp from 'sharp';

/**
 * Generate a Low Quality Image Placeholder (LQIP) for blur-up loading.
 *
 * Produces a tiny base64-encoded JPEG (~1-2 KB) that browsers can render
 * instantly while the real image loads. Combined with Next.js Image's
 * blurDataURL prop, this gives a smooth blur-to-sharp transition that
 * dramatically improves perceived load speed.
 *
 * Strategy:
 *   - Resize to 16x12 (tiny)
 *   - Convert to JPEG at low quality
 *   - Encode as base64 data URI
 *
 * The result looks like a blurry pixelated version of the image — under
 * 2 KB but visually representative.
 */
export async function generateBlurPlaceholder(buffer: Buffer): Promise<string> {
  try {
    const tinyBuffer = await sharp(buffer)
      .resize(16, 12, { fit: 'cover' })
      .jpeg({ quality: 50 })
      .toBuffer();

    return `data:image/jpeg;base64,${tinyBuffer.toString('base64')}`;
  } catch (err) {
    console.error('[blurPlaceholder] failed:', err);
    // Fallback: a generic gray placeholder
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAMABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAr/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
  }
}
