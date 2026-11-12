export const PHOTO_LIMIT = 8;
export const VIDEO_LIMIT = 3;
export const PHOTO_BYTES = 2 * 1024 * 1024;
export const VIDEO_BYTES = 8 * 1024 * 1024;
export const TOTAL_MEDIA_BYTES = 20 * 1024 * 1024;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];

export function validateProfileMedia(photos: unknown, videos: unknown): string | null {
  if (!Array.isArray(photos) || !photos.length || photos.length > PHOTO_LIMIT) return 'Keep between 1 and 8 photos, including your cover photo.';
  if (!Array.isArray(videos) || videos.length > VIDEO_LIMIT) return 'You can add up to 3 videos.';
  let total = 0;
  for (const [items, types, limit] of [[photos, PHOTO_TYPES, PHOTO_BYTES], [videos, VIDEO_TYPES, VIDEO_BYTES]] as const) {
    for (const source of items) {
      if (typeof source !== 'string') return 'Invalid media file.';
      // Existing hosted photos remain supported alongside device uploads.
      if (source.startsWith('https://') || /^\/(?!\/)/.test(source)) continue;
      const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/.exec(source);
      if (!match || !types.includes(match[1])) return 'Choose JPG, PNG, WebP, GIF photos or MP4, WebM, MOV videos.';
      const bytes = match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
      if (bytes > limit) return `Each photo must be under 2 MB and each video under 8 MB.`;
      total += bytes;
    }
  }
  return total > TOTAL_MEDIA_BYTES ? 'Your photos and videos must total 20 MB or less.' : null;
}

export function readMediaFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read file.'));
    reader.onerror = () => reject(new Error('Could not read file. Please try again.'));
    reader.onabort = () => reject(new Error('File reading was interrupted.'));
    reader.readAsDataURL(file);
  });
}
