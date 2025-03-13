import imageCompression from 'browser-image-compression';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE_MB = 2;
const MAX_VIDEO_SIZE_MB = 50;

export async function compressImage(file: File): Promise<File> {
  console.log("Compressing image:", file.name);

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new Error(`Invalid image type: ${file.type}. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`);
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
    throw new Error(`Failed to compress image: ${file.name}`);
  }
}

export function validateVideo(file: File): void {
  console.log("Validating video:", file.name);

  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    throw new Error(`Invalid video type: ${file.type}. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`);
  }

  if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
    throw new Error(`Video must be smaller than ${MAX_VIDEO_SIZE_MB}MB. Current size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`);
  }
}

export async function uploadMedia(files: File[]): Promise<string[]> {
  console.log("Starting media upload for files:", files.map(f => f.name));

  const formData = new FormData();

  for (const file of files) {
    try {
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        console.log("Processing image:", file.name);
        const compressed = await compressImage(file);
        formData.append('files', compressed);
      } else if (ALLOWED_VIDEO_TYPES.includes(file.type)) {
        console.log("Processing video:", file.name);
        validateVideo(file);
        formData.append('files', file);
      } else {
        throw new Error(`Unsupported file type: ${file.type}`);
      }
    } catch (error) {
      console.error("Error processing file:", file.name, error);
      throw error;
    }
  }

  try {
    console.log("Sending upload request...");
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upload failed: ${error}`);
    }

    const urls = await response.json();
    console.log("Upload successful, received URLs:", urls);
    return urls;
  } catch (error) {
    console.error("Upload request failed:", error);
    throw new Error(`Failed to upload media files: ${error.message}`);
  }
}