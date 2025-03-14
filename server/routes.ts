import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertOfferSchema, insertBuyCodeSchema, createInitialVehicleSchema, insertDealerSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import session from 'express-session';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for disk storage
const upload = multer({ 
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'video/mp4',
      'video/quicktime',
      'video/x-m4v',
      'video/webm',
      'application/pdf',
      'image/jpeg',
      'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
});

// Real VIN decoder implementation using NHTSA API
async function decodeVIN(vin: string) {
  try {
    console.log('Decoding VIN:', vin);
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`
    );

    if (!response.ok) {
      throw new Error('Failed to decode VIN');
    }

    const data = await response.json();
    const results = data.Results;

    const vehicleInfo = {
      year: results.find((item: any) => item.Variable === "Model Year")?.Value || "",
      make: results.find((item: any) => item.Variable === "Make")?.Value || "",
      model: results.find((item: any) => item.Variable === "Model")?.Value || "",
      trim: results.find((item: any) => item.Variable === "Trim")?.Value || "",
    };

    console.log('Decoded vehicle info:', vehicleInfo);
    return vehicleInfo;
  } catch (error) {
    console.error('Error decoding VIN:', error);
    throw new Error('Failed to decode VIN');
  }
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Configure static file serving for uploads
  app.use('/uploads', express.static(uploadDir));

  // Add session middleware
  app.use(
    session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === 'production' }
    })
  );

  // Admin dealer management routes
  app.post("/api/dealers", async (req, res) => {
    try {
      const result = insertDealerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }

      const dealer = await storage.createDealer(result.data);
      res.status(201).json(dealer);
    } catch (error) {
      console.error('Error creating dealer:', error);
      res.status(500).json({ message: "Failed to create dealer" });
    }
  });

  app.get("/api/dealers", async (_req, res) => {
    try {
      const dealers = await storage.getDealers();
      res.json(dealers);
    } catch (error) {
      console.error('Error fetching dealers:', error);
      res.status(500).json({ message: "Failed to fetch dealers" });
    }
  });

  app.patch("/api/dealers/:id", async (req, res) => {
    try {
      const { active } = req.body;
      const dealer = await storage.updateDealer(
        parseInt(req.params.id),
        { active }
      );
      res.json(dealer);
    } catch (error) {
      console.error('Error updating dealer:', error);
      res.status(500).json({ message: "Failed to update dealer" });
    }
  });

  // Public vehicle routes
  app.get("/api/vehicles", async (_req, res) => {
    const vehicles = await storage.getVehicles();
    res.json(vehicles);
  });

  app.get("/api/vehicles/:id", async (req, res) => {
    const vehicle = await storage.getVehicle(parseInt(req.params.id));
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });
    res.json(vehicle);
  });

  // Buy code verification with transaction creation
  app.post("/api/verify-code", async (req, res) => {
    const { code, vehicleId } = req.body;
    if (!code || !vehicleId) {
      return res.status(400).json({ message: "Code and vehicleId required" });
    }

    try {
      const buyCode = await storage.getBuyCode(code);
      if (!buyCode || !buyCode.active) {
        return res.status(403).json({ message: "Invalid buy code" });
      }

      // Check if the code has expired or reached max uses
      if (buyCode.maxUses && buyCode.usageCount >= buyCode.maxUses) {
        return res.status(403).json({ message: "Buy code has expired" });
      }

      if (buyCode.expiresAt && new Date(buyCode.expiresAt) < new Date()) {
        return res.status(403).json({ message: "Buy code has expired" });
      }

      // Get the vehicle
      const vehicle = await storage.getVehicle(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ message: "Vehicle not found" });
      }

      if (vehicle.status === 'sold') {
        return res.status(400).json({ message: "Vehicle is no longer available" });
      }

      // Create transaction
      const transaction = await storage.createTransaction({
        vehicleId,
        dealerId: buyCode.dealerId,
        buyCodeId: buyCode.id,
        amount: Number(vehicle.price),
        status: 'pending'
      });

      // Update buy code usage
      await storage.updateBuyCodeUsage(buyCode.id);

      // Mark vehicle as sold
      await storage.updateVehicle(vehicleId, {
        status: 'sold',
        inQueue: false
      });

      res.json({ 
        valid: true,
        transaction
      });
    } catch (error) {
      console.error('Error verifying buy code:', error);
      res.status(500).json({ message: "Failed to verify buy code" });
    }
  });

  // Vehicle upload routes
  app.post("/api/vehicles", async (req, res) => {
    const result = createInitialVehicleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }

    try {
      const vehicleInfo = await decodeVIN(result.data.vin);
      console.log('Creating vehicle with info:', vehicleInfo);

      const vehicle = await storage.createVehicle({
        ...result.data,
        year: parseInt(vehicleInfo.year),
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        trim: vehicleInfo.trim,
      });

      res.status(201).json(vehicle);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
  });

  app.post("/api/upload", upload.array('files'), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const fileUrls = files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      });

      res.json(fileUrls);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload files" });
    }
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

  // Transaction management
  app.patch("/api/transactions/:id", async (req, res) => {
    try {
      const { status, isPaid } = req.body;
      const transaction = await storage.updateTransaction(
        parseInt(req.params.id),
        { status, isPaid }
      );
      res.json(transaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ message: "Failed to update transaction" });
    }
  });

  app.get("/api/transactions", async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const transactionsWithVehicles = await Promise.all(
        transactions.map(async (transaction) => {
          const vehicle = await storage.getVehicle(transaction.vehicleId);
          return { ...transaction, vehicle };
        })
      );
      res.json(transactionsWithVehicles);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  // Bill of Sale upload
  app.post("/api/transactions/:id/bill-of-sale", upload.single('billOfSale'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

      const transaction = await storage.updateTransaction(
        parseInt(req.params.id),
        { billOfSale: fileUrl }
      );

      res.json(transaction);
    } catch (error) {
      console.error('Error uploading bill of sale:', error);
      res.status(500).json({ message: "Failed to upload bill of sale" });
    }
  });

  return httpServer;
}