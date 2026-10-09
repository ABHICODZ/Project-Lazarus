/** Browser-side image preparation: resize and re-encode as WebP so posts stay light. */

export interface Prepared {
  blob: Blob;
  /** File name with the right extension for the encoded bytes. */
  file: string;
  width: number;
  height: number;
}

const KEEP_AS_IS = new Set(['image/gif', 'image/svg+xml']); // animation / vector would be destroyed by a canvas
const EXT: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg' };

export const MAX_WIDTH = 1600;

export async function prepareImage(file: File, stem: string, maxWidth = MAX_WIDTH): Promise<Prepared> {
  if (KEEP_AS_IS.has(file.type)) {
    return { blob: file, file: `${stem}.${EXT[file.type]}`, width: 0, height: 0 };
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  // Some browsers cannot encode WebP and silently return PNG; name the file after what we actually got.
  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not encode the image'))), 'image/webp', 0.82));
  return { blob, file: `${stem}.${EXT[blob.type] ?? 'webp'}`, width, height };
}

export const humanSize = (n: number) => (n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`);

export async function toBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
