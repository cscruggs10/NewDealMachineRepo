import imageCompression from 'browser-image-compression';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/3gpp', 'video/3gpp2'];
const MAX_IMAGE_SIZE_MB = 2;
const MAX_VIDEO_SIZE_MB = 200; // Increased to support larger videos

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

// New Cloudinary upload function
export async function uploadVideoToCloudinary(file: File): Promise<{ videoUrl: string; thumbnailUrl: string }> {
  console.log("Uploading video to Cloudinary:", file.name);

  // Validate video
  validateVideo(file);

  try {
    // Get signed upload parameters from server
    const signatureResponse = await fetch('/api/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!signatureResponse.ok) {
      throw new Error('Failed to get upload signature');
    }

    const uploadParams = await signatureResponse.json();

    // Upload directly to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', uploadParams.timestamp);
    formData.append('signature', uploadParams.signature);
    formData.append('api_key', uploadParams.api_key);
    formData.append('folder', uploadParams.folder);
    formData.append('resource_type', uploadParams.resource_type);
    formData.append('eager', uploadParams.eager);

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${uploadParams.cloud_name}/upload`;
    
    console.log("Uploading to Cloudinary...");
    const uploadResponse = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      throw new Error(`Cloudinary upload failed: ${error}`);
    }

    const result = await uploadResponse.json();
    console.log("Cloudinary upload successful:", result);

    // Generate URLs
    const videoUrl = result.secure_url;
    const thumbnailUrl = result.eager[0]?.secure_url || videoUrl.replace(/\.[^.]*$/, '.jpg');

    return { videoUrl, thumbnailUrl };
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error(`Failed to upload video: ${error.message}`);
  }
}

// Legacy function - keeping for images if needed
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
      console.error('Upload response error:', response.status, error);
      
      if (response.status === 413) {
        throw new Error('File too large. Please try a smaller video.');
      } else if (response.status === 500) {
        throw new Error('Server error during upload. Please try again.');
      }
      
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