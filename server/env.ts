import { z } from "zod";

// Define the environment schema
const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 characters"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  
  // AWS S3 Configuration (optional for development)
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_BUCKET_NAME: z.string().optional(),
  AWS_REGION: z.string().default("us-east-1"),
  
  // Stripe Configuration (optional for development)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Google Sheets API (optional)
  GOOGLE_SHEETS_PRIVATE_KEY: z.string().optional(),
  GOOGLE_SHEETS_CLIENT_EMAIL: z.string().email().optional(),
  
  // Cloudinary Configuration
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const env = envSchema.parse(process.env);
    
    // Log successful validation (without sensitive data)
    console.log("✅ Environment variables validated successfully");
    console.log(`   - NODE_ENV: ${env.NODE_ENV}`);
    console.log(`   - DATABASE_URL: ${env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - SESSION_SECRET: ${env.SESSION_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`   - AWS Config: ${env.AWS_ACCESS_KEY_ID ? '✅ Set' : '⚠️  Optional - not set'}`);
    console.log(`   - Stripe Config: ${env.STRIPE_SECRET_KEY ? '✅ Set' : '⚠️  Optional - not set'}`);
    
    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Environment validation failed:");
      error.errors.forEach((err) => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
      
      // Provide helpful setup instructions
      console.error("\n💡 To fix this:");
      console.error("   1. Copy .env.example to .env");
      console.error("   2. Fill in the required values:");
      console.error("      - DATABASE_URL (your Neon PostgreSQL connection string)");
      console.error("      - SESSION_SECRET (generate a secure random string)");
      console.error("   3. Restart the server");
      
      process.exit(1);
    }
    
    console.error("❌ Unexpected error validating environment:", error);
    process.exit(1);
  }
}

// Validate environment on module load
export const env = validateEnv();