import { 
  type Vehicle, type InsertVehicle,
  type BuyCode, type InsertBuyCode,
  type Offer, type InsertOffer,
  type Dealer, type InsertDealer,
  type Transaction, type InsertTransaction,
  vehicles, buyCodes, offers, dealers, transactions,
  type AdminUser, type InsertAdminUser,
  adminUsers,
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
  getDealers(): Promise<Dealer[]>;
  updateDealer(id: number, update: Partial<Dealer>): Promise<Dealer>;
  getDealerByDealerName(dealerName: string): Promise<Dealer | undefined>;

  // Buy Codes
  getBuyCode(code: string): Promise<BuyCode | undefined>;
  createBuyCode(buyCode: InsertBuyCode): Promise<BuyCode>;
  updateBuyCodeUsage(id: number): Promise<BuyCode>;
  getDealerBuyCodes(dealerId: number): Promise<BuyCode[]>;
  getAllBuyCodes(): Promise<BuyCode[]>;

  // Transactions
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getDealerTransactions(dealerId: number): Promise<Transaction[]>;
  getTransactions(): Promise<Transaction[]>;
  updateTransaction(id: number, update: Partial<Transaction>): Promise<Transaction>;
  cancelVehicleTransactions(vehicleId: number): Promise<void>;

  // Offers
  getOffers(vehicleId: number): Promise<Offer[]>;
  getDealerOffers(dealerId: number): Promise<Offer[]>;
  createOffer(offer: InsertOffer): Promise<Offer>;
  updateOfferStatus(id: number, status: string): Promise<Offer>;

  // Admin Users
  getAdminByEmail(email: string): Promise<AdminUser | undefined>;
  createAdminUser(admin: InsertAdminUser): Promise<AdminUser>;
}

export class DatabaseStorage implements IStorage {
  // Vehicles
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

  // Dealers
  async createDealer(insertDealer: InsertDealer): Promise<Dealer> {
    try {
      console.log('Creating dealer with data:', insertDealer);
      const [dealer] = await db.insert(dealers).values(insertDealer).returning();
      console.log('Created dealer:', dealer);
      return dealer;
    } catch (error) {
      console.error('Error in createDealer:', error);
      throw error;
    }
  }

  async getDealerByUsername(username: string): Promise<Dealer | undefined> {
    const [dealer] = await db.select().from(dealers).where(eq(dealers.username, username));
    return dealer;
  }

  async getDealerById(id: number): Promise<Dealer | undefined> {
    const [dealer] = await db.select().from(dealers).where(eq(dealers.id, id));
    return dealer;
  }

  async getDealers(): Promise<Dealer[]> {
    return db.select().from(dealers);
  }

  async updateDealer(id: number, update: Partial<Dealer>): Promise<Dealer> {
    const [dealer] = await db
      .update(dealers)
      .set(update)
      .where(eq(dealers.id, id))
      .returning();
    return dealer;
  }

  async getDealerByDealerName(dealerName: string): Promise<Dealer | undefined> { 
    const [dealer] = await db.select().from(dealers).where(eq(dealers.dealerName, dealerName));
    return dealer;
  }

  // Buy Codes
  async getBuyCode(code: string): Promise<BuyCode | undefined> {
    const [buyCode] = await db
      .select()
      .from(buyCodes)
      .where(
        eq(buyCodes.code, code)
      );
    return buyCode;
  }

  async createBuyCode(insertBuyCode: InsertBuyCode): Promise<BuyCode> {
    const [buyCode] = await db.insert(buyCodes).values(insertBuyCode).returning();
    return buyCode;
  }

  async updateBuyCodeUsage(id: number): Promise<BuyCode> {
    // First get the current usage count
    const [current] = await db
      .select()
      .from(buyCodes)
      .where(eq(buyCodes.id, id));

    // Then increment it
    const [buyCode] = await db
      .update(buyCodes)
      .set({ 
        usageCount: (current?.usageCount || 0) + 1
      })
      .where(eq(buyCodes.id, id))
      .returning();
    return buyCode;
  }

  async getDealerBuyCodes(dealerId: number): Promise<BuyCode[]> {
    return db.select().from(buyCodes).where(eq(buyCodes.dealerId, dealerId));
  }

  async getAllBuyCodes(): Promise<BuyCode[]> { 
    return db.select().from(buyCodes);
  }

  // Transactions
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getDealerTransactions(dealerId: number): Promise<Transaction[]> {
    return db.select().from(transactions)
      .where(and(
        eq(transactions.dealerId, dealerId),
        eq(transactions.cancelled, false)
      )); // Only show non-cancelled transactions
  }

  async getTransactions(): Promise<Transaction[]> {
    return db.select().from(transactions);
  }

  async updateTransaction(id: number, update: Partial<Transaction>): Promise<Transaction> {
    const [transaction] = await db
      .update(transactions)
      .set(update)
      .where(eq(transactions.id, id))
      .returning();
    return transaction;
  }

  async cancelVehicleTransactions(vehicleId: number): Promise<void> {
    await db
      .update(transactions)
      .set({ cancelled: true })
      .where(eq(transactions.vehicleId, vehicleId));
  }

  // Offers
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

  // Admin Users
  async getAdminByEmail(email: string): Promise<AdminUser | undefined> {
    const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
    return admin;
  }

  async createAdminUser(admin: InsertAdminUser): Promise<AdminUser> {
    const [newAdmin] = await db.insert(adminUsers).values(admin).returning();
    return newAdmin;
  }
}

export const storage = new DatabaseStorage();