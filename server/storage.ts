import { 
  type Vehicle, type InsertVehicle,
  type BuyCode, type InsertBuyCode,
  type Offer, type InsertOffer
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private vehicles: Map<number, Vehicle>;
  private buyCodes: Map<number, BuyCode>;
  private offers: Map<number, Offer>;
  private currentIds: { vehicle: number; buyCode: number; offer: number };

  constructor() {
    this.vehicles = new Map();
    this.buyCodes = new Map();
    this.offers = new Map();
    this.currentIds = { vehicle: 1, buyCode: 1, offer: 1 };
  }

  async getVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async getVehicleByVin(vin: string): Promise<Vehicle | undefined> {
    return Array.from(this.vehicles.values()).find(v => v.vin === vin);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const id = this.currentIds.vehicle++;
    const vehicle: Vehicle = {
      ...insertVehicle,
      id,
      status: 'pending',
      inQueue: true,
      trim: insertVehicle.trim || null,
      make: insertVehicle.make || null,
      model: insertVehicle.model || null,
      year: insertVehicle.year || null,
      mileage: insertVehicle.mileage || null,
      price: insertVehicle.price || null,
      description: insertVehicle.description || null,
      condition: insertVehicle.condition || null,
      videos: insertVehicle.videos || [],
    };
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  async updateVehicle(id: number, update: Partial<Vehicle>): Promise<Vehicle> {
    const vehicle = await this.getVehicle(id);
    if (!vehicle) throw new Error('Vehicle not found');
    
    const updated = { ...vehicle, ...update };
    this.vehicles.set(id, updated);
    return updated;
  }

  async getBuyCode(code: string): Promise<BuyCode | undefined> {
    return Array.from(this.buyCodes.values()).find(bc => bc.code === code);
  }

  async createBuyCode(insertBuyCode: InsertBuyCode): Promise<BuyCode> {
    const id = this.currentIds.buyCode++;
    const buyCode: BuyCode = { ...insertBuyCode, id, active: true };
    this.buyCodes.set(id, buyCode);
    return buyCode;
  }

  async getOffers(vehicleId: number): Promise<Offer[]> {
    return Array.from(this.offers.values())
      .filter(o => o.vehicleId === vehicleId);
  }

  async createOffer(insertOffer: InsertOffer): Promise<Offer> {
    const id = this.currentIds.offer++;
    const offer: Offer = {
      ...insertOffer,
      id,
      status: 'pending',
      createdAt: new Date(),
    };
    this.offers.set(id, offer);
    return offer;
  }

  async updateOfferStatus(id: number, status: string): Promise<Offer> {
    const offer = this.offers.get(id);
    if (!offer) throw new Error('Offer not found');
    
    const updated = { ...offer, status };
    this.offers.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();