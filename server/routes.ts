import type { Express, Request, Response } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertOfferSchema, insertBuyCodeSchema, createInitialVehicleSchema, insertDealerSchema } from "@shared/schema";
import { sql } from "drizzle-orm";
import multer from "multer";
import path from "path";
import express from 'express';
import fs from 'fs';
import fetch from 'node-fetch';
import session from 'express-session';
import { tmpdir } from 'os';

// Modify the generateBuyCode function to create 4-character codes
function generateBuyCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

// Use system temp directory for serverless compatibility  
// Always use temp directory in serverless environments (Vercel sets VERCEL=1)
const isServerless = process.env.VERCEL || process.env.NODE_ENV === 'production';
const uploadDir = isServerless
  ? path.join(tmpdir(), 'uploads') 
  : path.join(process.cwd(), 'uploads');

// Debug logging for serverless
console.log('Upload directory config:', {
  cwd: process.cwd(),
  tmpdir: tmpdir(),
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  isServerless,
  uploadDir
});

// Ensure uploads directory exists
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Created upload directory:', uploadDir);
  } else {
    console.log('Upload directory already exists:', uploadDir);
  }
} catch (error) {
  console.error('Failed to create upload directory:', error);
  // Fallback to system temp directly
  const fallbackDir = tmpdir();
  console.log('Using fallback directory:', fallbackDir);
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
      'video/3gpp',
      'video/3gpp2',
      'video/x-msvideo',
      'video/mpeg',
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


async function requireAdmin(req: Request, res: Response, next: Function) {
  // Check for token in Authorization header first (for serverless)
  const authHeader = req.headers.authorization;
  let adminEmail: string | undefined;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [type, email, timestamp] = decoded.split(':');
      
      if (type === 'admin' && email) {
        // Check if token is not too old (24 hours)
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge < 24 * 60 * 60 * 1000) {
          adminEmail = email;
        }
      }
    } catch (e) {
      console.error('Token decode error:', e);
    }
  }
  
  // Fall back to session if no valid token
  if (!adminEmail) {
    adminEmail = req.session?.adminEmail;
  }
  
  if (!adminEmail) {
    return res.status(401).json({ message: "Admin authentication required" });
  }

  const admin = await storage.getAdminByEmail(adminEmail);
  if (!admin) {
    return res.status(403).json({ message: "Not authorized as admin" });
  }

  next();
}

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Configure static file serving for uploads
  app.use('/uploads', express.static(uploadDir));

  // Add session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'dev-secret-key-change-in-production',
      resave: false,
      saveUninitialized: false,
      cookie: { 
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    })
  );

  // Admin authentication routes
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email } = req.body;

      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(401).json({ message: "Not authorized as admin" });
      }

      // For serverless, we'll use a simple token approach
      // In production, you'd want to use JWT or similar
      const token = Buffer.from(`admin:${email}:${Date.now()}`).toString('base64');
      
      res.json({ 
        message: "Admin login successful",
        token: token,
        email: email
      });
    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({ message: "Admin login failed" });
    }
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.adminEmail = undefined;
    res.json({ message: "Admin logged out" });
  });

  // Protect admin routes
  app.get("/api/admin/check", requireAdmin, (req, res) => {
    res.json({ authorized: true });
  });
  
  // Debug endpoint to check session
  app.get("/api/session-debug", (req, res) => {
    res.json({
      hasSession: !!req.session,
      sessionId: req.sessionID,
      adminEmail: req.session?.adminEmail,
      sessionData: req.session
    });
  });


  // Admin dealer management routes
  app.post("/api/dealers", requireAdmin, async (req, res) => {
    try {
      const result = insertDealerSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }

      console.log('Creating dealer with data:', result.data);

      // Create dealer
      const dealer = await storage.createDealer(result.data);

      // Generate and create buy code for the dealer without limits
      const buyCode = await storage.createBuyCode({
        code: generateBuyCode(),
        dealerId: dealer.id,
      });

      // Return both dealer and buy code information
      res.status(201).json({ dealer, buyCode });
    } catch (error) {
      console.error('Error creating dealer:', error);
      res.status(500).json({ message: "Failed to create dealer", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/dealers", requireAdmin, async (_req, res) => {
    try {
      const dealers = await storage.getDealers();
      res.json(dealers);
    } catch (error) {
      console.error('Error fetching dealers:', error);
      res.status(500).json({ message: "Failed to fetch dealers" });
    }
  });

  app.patch("/api/dealers/:id", requireAdmin, async (req, res) => {
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

  // Update vehicle status route
  app.patch("/api/vehicles/:id", requireAdmin, async (req, res) => {
    try {
      const { status, inQueue, ...otherUpdates } = req.body;

      // Validate status
      if (status && !['active', 'sold', 'removed'].includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }

      const vehicle = await storage.updateVehicle(
        parseInt(req.params.id),
        { status, inQueue, ...otherUpdates }
      );

      res.json(vehicle);
    } catch (error) {
      console.error('Error updating vehicle:', error);
      res.status(500).json({ message: "Failed to update vehicle" });
    }
  });

  // Buy code verification with transaction creation
  app.post("/api/verify-code", async (req, res) => {
    const { code, vehicleId } = req.body;
    if (!code || !vehicleId) {
      return res.status(400).json({ message: "Code and vehicleId required" });
    }

    try {
      // Get the buy code
      const buyCode = await storage.getBuyCode(code);
      console.log('Found buy code:', buyCode); // Debug log

      if (!buyCode || !buyCode.active) {
        return res.status(403).json({ message: "Invalid buy code" });
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

  // Test endpoint for debugging
  app.post("/api/test-vehicle", async (req, res) => {
    console.log("TEST ENDPOINT - Raw body:", req.body);
    console.log("TEST ENDPOINT - Headers:", req.headers);
    res.json({ 
      success: true, 
      received: req.body,
      bodyType: typeof req.body,
      isArray: Array.isArray(req.body),
      keys: Object.keys(req.body || {})
    });
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      const { db } = await import("./db");
      const testQuery = await db.execute(sql`SELECT 1 as test`);
      
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasSessionSecret: !!process.env.SESSION_SECRET
        },
        database: {
          connected: true,
          testQuery: testQuery.rows[0]
        }
      });
    } catch (error) {
      res.status(500).json({
        status: "ERROR",
        timestamp: new Date().toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          hasSessionSecret: !!process.env.SESSION_SECRET
        },
        database: {
          connected: false,
          error: error.message
        }
      });
    }
  });

  // Cloudinary signature endpoint
  app.post("/api/cloudinary-signature", async (req, res) => {
    try {
      const { generateSignedUploadParams } = await import("./cloudinary");
      const signedParams = generateSignedUploadParams();
      res.json(signedParams);
    } catch (error) {
      console.error('Error generating Cloudinary signature:', error);
      res.status(500).json({ message: "Failed to generate upload signature" });
    }
  });

  // Test Cloudinary configuration
  app.get("/api/cloudinary-test", async (req, res) => {
    try {
      const { cloudinary, generateSignedUploadParams } = await import("./cloudinary");
      
      // Test if we can access Cloudinary API
      const timestamp = Math.round(new Date().getTime() / 1000);
      const testParams = {
        timestamp,
        folder: 'dealmachine-vehicle-videos',
        resource_type: 'video'
      };
      
      // Generate a test signature
      const signature = cloudinary.utils.api_sign_request(testParams, process.env.CLOUDINARY_API_SECRET?.trim() || '');
      
      // Also test the actual upload params generation
      const uploadParams = generateSignedUploadParams();
      
      res.json({
        status: "OK",
        environment: {
          hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
          hasApiKey: !!process.env.CLOUDINARY_API_KEY,
          hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
          cloudNameLength: process.env.CLOUDINARY_CLOUD_NAME?.trim().length,
          apiKeyLength: process.env.CLOUDINARY_API_KEY?.trim().length,
          apiSecretLength: process.env.CLOUDINARY_API_SECRET?.trim().length,
          cloudNameValue: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
          apiKeyValue: process.env.CLOUDINARY_API_KEY?.trim()
        },
        testSignature: {
          generated: !!signature,
          timestamp: timestamp
        },
        actualUploadParams: uploadParams
      });
    } catch (error) {
      console.error('Cloudinary test error:', error);
      res.status(500).json({ 
        status: "ERROR",
        error: error.message,
        environment: {
          hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
          hasApiKey: !!process.env.CLOUDINARY_API_KEY,
          hasApiSecret: !!process.env.CLOUDINARY_API_SECRET
        }
      });
    }
  });

  // Test Cloudinary direct upload
  app.post("/api/cloudinary-test-upload", async (req, res) => {
    try {
      const { cloudinary } = await import("./cloudinary");
      
      // Upload a test image
      const result = await cloudinary.uploader.upload(
        "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzQyODVGNCIvPjwvc3ZnPg==",
        {
          folder: 'dealmachine-vehicle-videos',
          resource_type: 'auto',
          public_id: 'test-' + Date.now()
        }
      );
      
      res.json({
        success: true,
        result: {
          public_id: result.public_id,
          url: result.secure_url,
          folder: result.folder
        }
      });
    } catch (error) {
      console.error('Test upload error:', error);
      res.status(500).json({ 
        success: false,
        error: error.message 
      });
    }
  });

  // Vehicle upload routes
  app.post("/api/vehicles", async (req, res) => {
    console.log('Received vehicle data:', req.body);
    console.log('Data types received:', {
      vin: typeof req.body.vin,
      year: typeof req.body.year,
      make: typeof req.body.make,
      model: typeof req.body.model,
      videos: Array.isArray(req.body.videos)
    });
    
    const result = createInitialVehicleSchema.safeParse(req.body);
    if (!result.success) {
      console.error('Schema validation failed:', JSON.stringify(result.error.format(), null, 2));
      const firstError = result.error.issues[0];
      return res.status(400).json({ 
        message: firstError.message,
        field: firstError.path.join('.'),
        code: firstError.code,
        details: result.error.format()
      });
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
        return `/uploads/${file.filename}`;
      });

      res.json(fileUrls);
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload files" });
    }
  });

  // Buy code management
  app.post("/api/buy-codes", async (req, res) => {
    try {
      const buyCode = await storage.createBuyCode({
        code: generateBuyCode(),
        dealerId: req.body.dealerId,
      });
      res.status(201).json(buyCode);
    } catch (error) {
      console.error('Error generating buy code:', error);
      res.status(500).json({ message: "Failed to generate buy code" });
    }
  });

  // Add this GET endpoint for buy codes after the existing buy code routes
  app.get("/api/buy-codes", async (_req, res) => {
    try {
      const buyCodes = await storage.getAllBuyCodes();
      res.json(buyCodes);
    } catch (error) {
      console.error('Error fetching buy codes:', error);
      res.status(500).json({ message: "Failed to fetch buy codes" });
    }
  });

  // Dealer-specific routes
  app.get("/api/dealer/buycodes", async (req, res) => {
    try {
      // Get dealer ID from the session - TODO: Add proper auth
      const dealerId = 1; // Temporarily hardcoded
      const buyCodes = await storage.getDealerBuyCodes(dealerId);
      res.json(buyCodes);
    } catch (error) {
      console.error('Error fetching dealer buy codes:', error);
      res.status(500).json({ message: "Failed to fetch buy codes" });
    }
  });

  app.get("/api/dealer/transactions", async (req, res) => {
    try {
      // Get dealer ID from the session
      const dealerId = req.session.dealerId;
      if (!dealerId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const transactions = await storage.getDealerTransactions(dealerId);
      const transactionsWithVehicles = await Promise.all(
        transactions.map(async (transaction) => {
          const vehicle = await storage.getVehicle(transaction.vehicleId);
          return { ...transaction, vehicle };
        })
      );

      res.json(transactionsWithVehicles);
    } catch (error) {
      console.error('Error fetching dealer transactions:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/dealer/offers", async (req, res) => {
    try {
      // Get dealer ID from the session - TODO: Add proper auth
      const dealerId = 1; // Temporarily hardcoded
      const offers = await storage.getDealerOffers(dealerId);
      res.json(offers);
    } catch (error) {
      console.error('Error fetching dealer offers:', error);
      res.status(500).json({ message: "Failed to fetch offers" });
    }
  });

  // Transaction management
  app.patch("/api/transactions/:id", requireAdmin, async (req, res) => {
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

  app.get("/api/transactions", requireAdmin, async (_req, res) => {
    try {
      const transactions = await storage.getTransactions();
      const transactionsWithDetails = await Promise.all(
        transactions.map(async (transaction) => {
          const vehicle = await storage.getVehicle(transaction.vehicleId);
          const dealer = await storage.getDealerById(transaction.dealerId);
          return { 
            ...transaction, 
            vehicle,
            dealerName: dealer?.dealerName 
          };
        })
      );
      res.json(transactionsWithDetails);
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

      const fileUrl = `/uploads/${file.filename}`;

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

  // Dealer Authentication
  app.post("/api/dealer/login", async (req, res) => {
    try {
      const { dealerName, buyCode } = req.body;
      if (!dealerName || !buyCode) {
        return res.status(400).json({ message: "Dealer name and buy code required" });
      }

      // Find dealer by name
      const dealer = await storage.getDealerByDealerName(dealerName);
      if (!dealer) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check active buy codes for this dealer
      const dealerBuyCodes = await storage.getDealerBuyCodes(dealer.id);
      const validCode = dealerBuyCodes.find(code => code.code === buyCode && code.active);
      if (!validCode) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Set session data
      req.session.dealerId = dealer.id;

      // Return dealer info (excluding sensitive data)
      const { id, dealerName: name, email, address } = dealer;
      return res.json({ id, dealerName: name, email, address });
    } catch (error) {
      console.error("Error during dealer login:", error);
      return res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/dealer/logout", (req, res) => {
    req.session.destroy(() => {
      res.sendStatus(200);
    });
  });

  return httpServer;
}