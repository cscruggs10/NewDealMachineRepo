import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set - running in demo mode without database");
  process.env.DATABASE_URL = "postgresql://demo:demo@localhost:5432/demo";
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Database wrapper for demo mode
export async function safeDbOperation<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.warn("⚠️  Database operation failed in demo mode:", error.message);
    return fallback;
  }
}
