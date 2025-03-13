import { pgTable, text, serial, integer, decimal, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  vin: text("vin").notNull(),
  make: text("make").notNull(),
  model: text("model").notNull(),
  year: integer("year").notNull(),
  mileage: integer("mileage").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }),
  description: text("description"),
  condition: text("condition"),
  images: text("images").array(),
  videos: text("videos").array(),
  status: text("status").notNull().default('pending'), // pending, active, sold
  inQueue: boolean("in_queue").notNull().default(true),
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
  status: text("status").notNull().default('pending'), // pending, accepted, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({ 
  id: true,
  status: true,
  inQueue: true 
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
export type BuyCode = typeof buyCodes.$inferSelect;
export type InsertBuyCode = z.infer<typeof insertBuyCodeSchema>;
export type Offer = typeof offers.$inferSelect;
export type InsertOffer = z.infer<typeof insertOfferSchema>;
