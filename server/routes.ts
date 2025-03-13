import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertOfferSchema, insertBuyCodeSchema, createInitialVehicleSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';

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
      // Create a unique filename with timestamp
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  }),
  fileFilter: (_req, file, cb) => {
    // Accept common video formats including iOS formats
    const allowedTypes = [
      'video/mp4',
      'video/quicktime', // For .mov files from iOS
      'video/x-m4v',     // For iOS M4V format
      'video/webm'
    ];

    console.log('Received file:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported video format: ${file.mimetype}. Allowed formats: ${allowedTypes.join(', ')}`));
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

  // Admin vehicle routes
  app.post("/api/vehicles", async (req, res) => {
    const result = createInitialVehicleSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: result.error.message });
    }

    try {
      // Get the decoded VIN data
      const vehicleInfo = await decodeVIN(result.data.vin);
      console.log('Creating vehicle with info:', vehicleInfo);

      // Create vehicle with both decoded info and provided data
      const vehicle = await storage.createVehicle({
        ...result.data,
        year: parseInt(vehicleInfo.year),
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        trim: vehicleInfo.trim,
        status: 'pending',
        inQueue: true,
      });

      res.status(201).json(vehicle);
    } catch (error) {
      console.error('Error creating vehicle:', error);
      res.status(500).json({ message: "Failed to create vehicle" });
    }
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

  // Upload endpoint
  app.post("/api/upload", upload.array('files'), async (req, res) => {
    try {
      console.log("Processing video upload...");

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      console.log("Files received:", req.files.map(f => ({
        name: f.originalname,
        type: f.mimetype,
        size: f.size
      })));

      // Create URLs for the uploaded files
      const fileUrls = req.files.map(file => {
        return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
      });

      console.log("Upload successful, URLs:", fileUrls);
      res.json(fileUrls);
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ 
        message: "Failed to upload files",
        error: errorMessage
      });
    }
  });

  return httpServer;
}