'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, Star, Loader2 } from 'lucide-react';

import type { PostAdDraft } from './PostAdWizard';
import { cn } from '@/lib/utils';

interface Props {
  draft: PostAdDraft;
  update: (patch: Partial<PostAdDraft>) => void;
}

const MAX_IMAGES = 6;
const MIN_IMAGES = 3;
const TARGET_WIDTH = 1600;
const TARGET_QUALITY = 0.82;
const MAX_FILE_BYTES = 8 * 1024 * 1024;

export function StepImages({ draft, update }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  /** Resize image client-side via Canvas — keeps server light + saves bandwidth. */
  const resizeImage = useCallback(async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => { img.src = e.target?.result as string; };
      reader.onerror = () => reject(new Error('Failed to read file'));

      img.onload = () => {
        const scale = img.width > TARGET_WIDTH ? TARGET_WIDTH / img.width : 1;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas context unavailable'));

        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
          'image/jpeg',
          TARGET_QUALITY,
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      reader.readAsDataURL(file);
    });
  }, []);

  const uploadOne = useCallback(async (file: File): Promise<string> => {
    if (file.size > MAX_FILE_BYTES) throw new Error('Image too large (max 8 MB)');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Only JPG, PNG, WebP allowed');
    }

    // Compress client-side
    const compressed = await resizeImage(file);

    // Ask server for a presigned URL
    const upRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: file.name,
        contentType: 'image/jpeg',
        size: compressed.size,
      }),
    });
    if (!upRes.ok) throw new Error((await upRes.json()).error ?? 'Upload prep failed');
    const { uploadUrl, publicUrl } = await upRes.json();

    // PUT directly to R2
    const putRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/jpeg' },
      body: compressed,
    });
    if (!putRes.ok) throw new Error('Upload failed');

    return publicUrl as string;
  }, [resizeImage]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_IMAGES - draft.imageUrls.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (toUpload.length === 0) {
      setError(`You can only upload ${MAX_IMAGES} photos.`);
      return;
    }

    setUploading(true);
    setProgress({ done: 0, total: toUpload.length });

    const uploadedUrls: string[] = [];
    for (const file of toUpload) {
      try {
        const url = await uploadOne(file);
        uploadedUrls.push(url);
        update({ imageUrls: [...draft.imageUrls, ...uploadedUrls] });
        setProgress((p) => ({ ...p, done: p.done + 1 }));
      } catch (err: any) {
        setError(err.message ?? 'Upload failed');
        break;
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = (url: string) => {
    update({ imageUrls: draft.imageUrls.filter((u) => u !== url) });
  };

  const makePrimary = (url: string) => {
    update({ imageUrls: [url, ...draft.imageUrls.filter((u) => u !== url)] });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold text-base">Add Photos</h2>
        <p className="text-xs text-gray-500 mt-1">
          Upload {MIN_IMAGES}–{MAX_IMAGES} clear photos. First photo is the cover image.
        </p>
      </div>

      {/* Grid of uploaded photos */}
      <div className="grid grid-cols-3 gap-2">
        {draft.imageUrls.map((url, i) => (
          <div key={url} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 group">
            <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            {i === 0 && (
              <div className="absolute top-1 left-1 bg-amber-500 text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-current" />
                Cover
              </div>
            )}
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-opacity"
              aria-label="Remove photo"
            >
              <X className="w-3 h-3" />
            </button>
            {i !== 0 && (
              <button
                type="button"
                onClick={() => makePrimary(url)}
                className="absolute bottom-1 left-1 bg-white/90 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Set as cover
              </button>
            )}
          </div>
        ))}

        {/* Add button (if not maxed) */}
        {draft.imageUrls.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              'aspect-[4/3] rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors',
              'border-[var(--color-border)] hover:border-[var(--brand-green)] hover:bg-[var(--brand-bg)]',
              uploading && 'opacity-50 cursor-wait',
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                <span className="text-[10px] text-gray-500">
                  {progress.done}/{progress.total}
                </span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-[10px] text-gray-500">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="text-xs text-gray-400 space-y-1">
        <p>• Photos are auto-resized and compressed</p>
        <p>• Take photos in good light, show interior and exterior</p>
        <p>• Personal info (number plates) is preserved — blur if you want</p>
      </div>

      <p className="text-xs text-gray-500 text-center pt-2">
        {draft.imageUrls.length} of {MAX_IMAGES} photos
        {draft.imageUrls.length < MIN_IMAGES && (
          <span className="text-red-500"> · need at least {MIN_IMAGES}</span>
        )}
      </p>
    </div>
  );
}
