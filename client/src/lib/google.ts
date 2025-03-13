import { sheets_v4 } from '@googleapis/sheets';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  key: process.env.GOOGLE_API_KEY,
});

const sheets = google.sheets({ version: 'v4', auth });

export async function fetchVehiclesFromSheet() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Vehicles!A2:J',
    });

    const rows = response.data.values;
    if (!rows) return [];

    return rows.map(row => ({
      vin: row[0],
      year: parseInt(row[1]),
      make: row[2],
      model: row[3],
      mileage: parseInt(row[4]),
      price: row[5],
      description: row[6] || null,
      condition: row[7] || null,
      images: row[8] ? row[8].split(',').map(url => url.trim()) : [],
      videos: row[9] ? row[9].split(',').map(url => url.trim()) : [],
    }));
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    throw new Error('Failed to fetch vehicle data');
  }
}