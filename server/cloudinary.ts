import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

// Configure Cloudinary - trim any whitespace from env vars
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME.trim(),
  api_key: env.CLOUDINARY_API_KEY.trim(),
  api_secret: env.CLOUDINARY_API_SECRET.trim(),
});

export { cloudinary };

// Generate signed upload parameters for direct upload
export function generateSignedUploadParams() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  // Only include parameters that Cloudinary uses for signature verification
  const signatureParams = {
    eager: 'c_thumb,w_300,h_200',
    folder: 'dealmachine-vehicle-videos',
    timestamp: timestamp,
  };

  const signature = cloudinary.utils.api_sign_request(signatureParams, env.CLOUDINARY_API_SECRET.trim());

  // Return all parameters needed for upload
  return {
    timestamp,
    folder: 'dealmachine-vehicle-videos',
    resource_type: 'video',
    eager: 'c_thumb,w_300,h_200',
    signature,
    api_key: env.CLOUDINARY_API_KEY.trim(),
    cloud_name: env.CLOUDINARY_CLOUD_NAME.trim(),
  };
}

// Get video URL and thumbnail URL from Cloudinary public_id
export function getVideoUrls(publicId: string) {
  const videoUrl = cloudinary.url(publicId, {
    resource_type: 'video',
    secure: true,
  });

  const thumbnailUrl = cloudinary.url(publicId, {
    resource_type: 'video',
    format: 'jpg',
    transformation: 'c_thumb,w_300,h_200',
    secure: true,
  });

  return { videoUrl, thumbnailUrl };
}