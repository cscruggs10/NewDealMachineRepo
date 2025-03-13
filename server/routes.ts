import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertOfferSchema, insertBuyCodeSchema } from "@shared/schema";
import { google } from "googleapis";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Google Sheets sync endpoint
  app.post("/api/sync-vehicles", async (_req, res) => {
    try {
      console.log('Starting Google Sheets sync...');

      // Initialize the Sheets API with API key
      const sheets = google.sheets({ 
        version: 'v4',
        auth: process.env.GOOGLE_API_KEY 
      });

      console.log('Fetching sheet data...');
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: 'RAW DATA!A2:J',
      });

      const rows = response.data.values;
      if (!rows) {
        console.log('No data found in sheet');
        return res.json({ message: "No data found in sheet", vehicles: [] });
      }

      console.log(`Found ${rows.length} rows in sheet`);

      const vehicles = await Promise.all(rows.map(async (row, index) => {
        try {
          const vehicleData = {
            vin: row[0],
            year: parseInt(row[1]),
            make: row[2],
            model: row[3],
            mileage: parseInt(row[4]),
            price: row[5],
            description: row[6] || null,
            condition: row[7] || null,
            images: row[8] ? row[8].split(',').map((url: string) => url.trim()) : [],
            videos: row[9] ? row[9].split(',').map((url: string) => url.trim()) : [],
          };

          const result = insertVehicleSchema.safeParse(vehicleData);
          if (!result.success) {
            console.error(`Invalid vehicle data at row ${index + 2}:`, result.error);
            return null;
          }

          return storage.createVehicle(result.data);
        } catch (error) {
          console.error(`Error processing row ${index + 2}:`, error);
          return null;
        }
      }));

      const validVehicles = vehicles.filter(v => v !== null);
      console.log(`Successfully processed ${validVehicles.length} valid vehicles`);

      res.json({
        message: `Successfully synced ${validVehicles.length} vehicles`,
        vehicles: validVehicles
      });
    } catch (error) {
      console.error('Error syncing vehicles:', error);
      // Send more detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: "Failed to sync vehicles from sheet",
        error: errorMessage
      });
    }
  });

  // Public vehicle routes
  app.get("/api/vehicles", async (_req, res) => {
    const vehicles = await storage.getVehicles();
    res.json(vehicles.filter(v => v.status === 'active'));
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    const vehicle = await storage.getVehicle(parseInt(req.params.id));
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  });

  // Admin vehicle routes
  app.post("/api/vehicles", async (req, res) => {
    const result = insertVehicleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const vehicle = await storage.createVehicle(result.data);
    res.status(201).json(vehicle);
  });

  app.patch("/api/vehicles/:id", async (req, res) => {
    const vehicle = await storage.updateVehicle(
      parseInt(req.params.id),
      req.body
    );
    res.json(vehicle);
  });

  // Buy code verification
  app.post("/api/verify-code", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: "Code required" });

    const buyCode = await storage.getBuyCode(code);
    if (!buyCode || !buyCode.active) {
      return res.status(403).json({ message: "Invalid buy code" });
    }
    res.json({ valid: true });
  });

  // Offer management
  app.post("/api/vehicles/:id/offers", async (req, res) => {
    const result = insertOfferSchema.safeParse({
      ...req.body,
      vehicleId: parseInt(req.params.id)
    });
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const offer = await storage.createOffer(result.data);
    res.status(201).json(offer);
  });

  app.get("/api/vehicles/:id/offers", async (req, res) => {
    const offers = await storage.getOffers(parseInt(req.params.id));
    res.json(offers);
  });

  app.patch("/api/offers/:id", async (req, res) => {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status required" });

    const offer = await storage.updateOfferStatus(
      parseInt(req.params.id),
      status
    );
    res.json(offer);
  });

  // Buy code management
  app.post("/api/buy-codes", async (req, res) => {
    const result = insertBuyCodeSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }
    const buyCode = await storage.createBuyCode(result.data);
    res.status(201).json(buyCode);
  });

  return httpServer;
}