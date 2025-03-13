import { pgTable, text, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  status: text("status").notNull().default('pending'), 
  inQueue: boolean("in_queue").notNull().default(true),
});

// Initial vehicle creation schema (only VIN and videos required)
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
}).extend({
  vin: z.string().length(8, "Please enter the last 8 digits of the VIN"),
  videos: z.array(z.string()).optional(),
});

// Complete vehicle schema for admin completion
export const insertVehicleSchema = createInsertSchema(vehicles).omit({ 
  id: true,
  status: true,
  inQueue: true 
}).extend({
  vin: z.string().length(8, "Please enter the last 8 digits of the VIN"),
  make: z.string().min(1, "Make is required"),
  model: z.string().min(1, "Model is required"),
  trim: z.string().optional(),
  year: z.number().min(1900, "Invalid year").max(new Date().getFullYear() + 1, "Invalid year"),
  mileage: z.number().min(0, "Invalid mileage"),
  price: z.string().min(1, "Price is required"),
  condition: z.string().min(1, "Certification is required"),
  description: z.string().optional(),
  videos: z.array(z.string()).optional(),
});

export const buyCodes = pgTable("buy_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  dealerName: text("dealer_name").notNull(),
  active: boolean("active").notNull().default(true),
});

export const offers = pgTable("offers", {
  id: serial("id").primaryKey(),
  vehicleId: integer("vehicle_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dealerName: text("dealer_name").notNull(),
  contactInfo: text("contact_info").notNull(),
  status: text("status").notNull().default('pending'), 
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBuyCodeSchema = createInsertSchema(buyCodes).omit({ 
  id: true,
  active: true 
});

export const insertOfferSchema = createInsertSchema(offers).omit({ 
  id: true,
  status: true,
  createdAt: true 
});

export type Vehicle = typeof vehicles.$inferSelect;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InitialVehicle = z.infer<typeof createInitialVehicleSchema>;
export type BuyCode = typeof buyCodes.$inferSelect;
export type InsertBuyCode = z.infer<typeof insertBuyCodeSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;