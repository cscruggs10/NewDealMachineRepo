import { pgTable, text, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const dealers = pgTable("dealers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  dealerName: text("dealer_name").notNull(),
  email: text("email").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vin: text("vin").notNull(),
  make: text("make"),
  model: text("model"),
  trim: text("trim"),
  year: integer("year"),
  mileage: integer("mileage"),
  price: text("price"),
  description: text("description"),
  condition: text("condition"),
  videos: text("videos").array(),
  status: text("status").notNull().default('pending'), // 'pending', 'active', 'sold'
  inQueue: boolean("in_queue").notNull().default(true),
  billOfSale: text("bill_of_sale"), // URL to uploaded bill of sale document
  isPaid: boolean("is_paid").default(false),
});

export const buyCodes = pgTable("buy_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  dealerId: integer("dealer_id").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  usageCount: integer("usage_count").notNull().default(0),
  maxUses: integer("max_uses"),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  dealerId: integer("dealer_id").notNull(),
  buyCodeId: integer("buy_code_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'completed'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  isPaid: boolean("is_paid").default(false),
  billOfSale: text("bill_of_sale"), // URL to uploaded bill of sale document
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  dealerId: integer("dealer_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Schema definitions for inserts
export const insertDealerSchema = createInsertSchema(dealers).omit({
  id: true,
  active: true,
  createdAt: true
});

export const createInitialVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  status: true,
  inQueue: true,
  make: true,
  model: true,
  trim: true,
  year: true,
  mileage: true,
  price: true,
  condition: true,
  description: true,
  billOfSale: true,
  isPaid: true,
}).extend({
  vin: z.string().length(17, "Please enter the full 17-character VIN"),
  videos: z.array(z.string()).optional(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  status: true,
  inQueue: true,
  billOfSale: true,
  isPaid: true,
}).extend({
  vin: z.string().length(17, "VIN must be 17 characters"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().optional(),
  year: z.number().int().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  mileage: z.number().int().min(0, "Invalid mileage"),
  price: z.string().min(1, "Price is required"),
  condition: z.enum(["Deal Machine Certified", "Auction Certified"], {
    required_error: "Certification type is required",
  }),
  videos: z.array(z.string()).min(1, "Video walkthrough is required"),
});

export const insertBuyCodeSchema = createInsertSchema(buyCodes).omit({
  id: true,
  active: true,
  createdAt: true,
  usageCount: true
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  isPaid: true,
  billOfSale: true,
});

export const insertOfferSchema = createInsertSchema(offers).omit({
  id: true,
  status: true,
  createdAt: true
});

// Types
export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InitialVehicle = z.infer<typeof createInitialVehicleSchema>;
export type Dealer = typeof dealers.$inferSelect;
export type InsertDealer = z.infer<typeof insertDealerSchema>;
export type BuyCode = typeof buyCodes.$inferSelect;
export type InsertBuyCode = z.infer<typeof insertBuyCodeSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;