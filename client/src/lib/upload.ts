import imageCompression from 'browser-image-compression';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE_MB = 2;
const MAX_VIDEO_SIZE_MB = 50;

export async function compressImage(file: File): Promise<File> {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error('Invalid image type');
  }

  const options = {
    maxSizeMB: MAX_IMAGE_SIZE_MB,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    return await imageCompression(file, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

export function validateVideo(file: File): void {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error('Invalid video type');
  }

  if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    throw new Error(`Video must be smaller than ${MAX_VIDEO_SIZE_MB}MB`);
  }
}

export async function uploadMedia(files: File[]): Promise<string[]> {
  const formData = new FormData();
  
  for (const file of files) {
    if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
      const compressed = await compressImage(file);
      formData.append('files', compressed);
    } else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
      validateVideo(file);
      formData.append('files', file);
    }
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload media');
  }

  return response.json();
}
