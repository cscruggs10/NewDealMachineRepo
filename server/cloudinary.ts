import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Generate signed upload parameters for direct upload
export function generateSignedUploadParams() {
  const timestamp = Math.round(new Date().getTime() / 1000);
  
  const params = {
    timestamp,
    folder: 'dealmachine/vehicle-videos',
    resource_type: 'video',
    eager: 'c_thumb,w_300,h_200', // Generate thumbnail
  };

  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);

  return {
    ...params,
    signature,
    api_key: env.CLOUDINARY_API_KEY,
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
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