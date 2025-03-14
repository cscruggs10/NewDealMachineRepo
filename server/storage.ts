import { 
  type Vehicle, type InsertVehicle,
  type BuyCode, type InsertBuyCode,
  type Offer, type InsertOffer,
  type Dealer, type InsertDealer,
  type Transaction, type InsertTransaction,
  vehicles, buyCodes, offers, dealers, transactions
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Vehicles
  getVehicles(): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  getVehicleByVin(vin: string): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, vehicle: Partial<Vehicle>): Promise<Vehicle>;

  // Dealers
  createDealer(dealer: InsertDealer): Promise<Dealer>;
  getDealerByUsername(username: string): Promise<Dealer | undefined>;
  getDealerById(id: number): Promise<Dealer | undefined>;

  // Buy Codes
  getBuyCode(code: string): Promise<BuyCode | undefined>;
  createBuyCode(buyCode: InsertBuyCode): Promise<BuyCode>;
  updateBuyCodeUsage(id: number): Promise<BuyCode>;
  getDealerBuyCodes(dealerId: number): Promise<BuyCode[]>;

  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getDealerTransactions(dealerId: number): Promise<Transaction[]>;

  // Offers
  getOffers(vehicleId: number): Promise<Offer[]>;
  getDealerOffers(dealerId: number): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOfferStatus(id: number, status: string): Promise<Offer>;
}

export class DatabaseStorage implements IStorage {
  // Existing vehicle methods
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

  // Dealer methods
  async createDealer(insertDealer: InsertDealer): Promise<Dealer> {
    const [dealer] = await db.insert(dealers).values(insertDealer).returning();
    return dealer;
  }

  async getDealerByUsername(username: string): Promise<Dealer | undefined> {
    const [dealer] = await db.select().from(dealers).where(eq(dealers.username, username));
    return dealer;
  }

  async getDealerById(id: number): Promise<Dealer | undefined> {
    const [dealer] = await db.select().from(dealers).where(eq(dealers.id, id));
    return dealer;
  }

  // Buy code methods
  async getBuyCode(code: string): Promise<BuyCode | undefined> {
    const [buyCode] = await db
      .select()
      .from(buyCodes)
      .where(
        and(
          eq(buyCodes.code, code),
          eq(buyCodes.active, true)
        )
      );
    return buyCode;
  }

  async createBuyCode(insertBuyCode: InsertBuyCode): Promise<BuyCode> {
    const [buyCode] = await db.insert(buyCodes).values(insertBuyCode).returning();
    return buyCode;
  }

  async updateBuyCodeUsage(id: number): Promise<BuyCode> {
    const [buyCode] = await db
      .update(buyCodes)
      .set({ 
        usageCount: db.raw('usage_count + 1')
      })
      .where(eq(buyCodes.id, id))
      .returning();
    return buyCode;
  }

  async getDealerBuyCodes(dealerId: number): Promise<BuyCode[]> {
    return db.select().from(buyCodes).where(eq(buyCodes.dealerId, dealerId));
  }

  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getDealerTransactions(dealerId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.dealerId, dealerId));
  }

  // Offer methods
  async getOffers(vehicleId: number): Promise<Offer[]> {
    return db.select().from(offers).where(eq(offers.vehicleId, vehicleId));
  }

  async getDealerOffers(dealerId: number): Promise<Offer[]> {
    return db.select().from(offers).where(eq(offers.dealerId, dealerId));
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