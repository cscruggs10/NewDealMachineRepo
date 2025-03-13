import { 
  type Vehicle, type InsertVehicle,
  type BuyCode, type InsertBuyCode,
  type Offer, type InsertOffer,
  vehicles, buyCodes, offers
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByVin(vin: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle>;

  // Buy Codes
  getBuyCode(code: string): Promise<BuyCode | undefined>;
  createBuyCode(buyCode: InsertBuyCode): Promise<BuyCode>;

  // Offers
  getOffers(vehicleId: number): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOfferStatus(id: number, status: string): Promise<Offer>;
}

export class DatabaseStorage implements IStorage {
  async getVehicles(): Promise<Vehicle[]> {
    return db.select().from(vehicles);
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.id, id));
    return vehicle;
  }

  async getVehicleByVin(vin: string): Promise<Vehicle | undefined> {
    const [vehicle] = await db.select().from(vehicles).where(eq(vehicles.vin, vin));
    return vehicle;
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const [vehicle] = await db.insert(vehicles).values(insertVehicle).returning();
    return vehicle;
  }

  async updateVehicle(id: number, update: Partial<Vehicle>): Promise<Vehicle> {
    const [vehicle] = await db
      .update(vehicles)
      .set(update)
      .where(eq(vehicles.id, id))
      .returning();
    return vehicle;
  }

  async getBuyCode(code: string): Promise<BuyCode | undefined> {
    const [buyCode] = await db.select().from(buyCodes).where(eq(buyCodes.code, code));
    return buyCode;
  }

  async createBuyCode(insertBuyCode: InsertBuyCode): Promise<BuyCode> {
    const [buyCode] = await db.insert(buyCodes).values(insertBuyCode).returning();
    return buyCode;
  }

  async getOffers(vehicleId: number): Promise<Offer[]> {
    return db.select().from(offers).where(eq(offers.vehicleId, vehicleId));
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const [offer] = await db.insert(offers).values(insertOffer).returning();
    return offer;
  }

  async updateOfferStatus(id: number, status: string): Promise<Offer> {
    const [offer] = await db
      .update(offers)
      .set({ status })
      .where(eq(offers.id, id))
      .returning();
    return offer;
  }
}

export const storage = new DatabaseStorage();