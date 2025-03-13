import { google } from '@googleapis/sheets';

const sheets = google.sheets('v4');

export async function fetchVehiclesFromSheet() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Vehicles!A2:J',
      key: process.env.GOOGLE_API_KEY,
    });

    const rows = response.data.values;
    if (!rows) return [];

    return rows.map(row => ({
      vin: row[0],
      year: parseInt(row[1]),
      make: row[2],
      model: row[3],
      mileage: parseInt(row[4]),
      price: parseFloat(row[5]),
      description: row[6],
      condition: row[7],
      images: row[8]?.split(',') || [],
      videos: row[9]?.split(',') || [],
    }));
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    throw new Error('Failed to fetch vehicle data');
  }
}
