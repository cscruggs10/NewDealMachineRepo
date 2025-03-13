import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertVehicleSchema, insertOfferSchema, insertBuyCodeSchema } from "@shared/schema";
import { google } from "@googleapis/sheets";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

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
