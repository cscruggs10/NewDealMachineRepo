import { google } from 'googleapis';
import { Readable } from 'stream';

const drive = google.drive({ 
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY
});

export async function uploadToGoogleDrive(file: Express.Multer.File) {
  try {
    console.log('Uploading file to Google Drive:', file.originalname);

    const fileMetadata = {
      name: file.originalname,
      mimeType: file.mimetype,
    };

    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // Make the file publicly accessible
    await drive.permissions.create({
      fileId: response.data.id!,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    console.log('Upload successful, file ID:', response.data.id);
    return response.data.webViewLink;
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new Error('Failed to upload file to Google Drive');
  }
}
