import "dotenv/config";
import { env } from "./env";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";

// Simple log function for serverless
const log = (message: string, source = "express") => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
};

// Simple static file serving without Vite
function serveStatic(app: express.Express) {
  const publicPath = path.resolve("dist/public");
  app.use(express.static(publicPath));
  
  // Handle client-side routing
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(publicPath, "index.html"));
    }
  });
}

export const app = express();
app.use(express.json({ limit: '250mb' }));
app.use(express.urlencoded({ extended: false, limit: '250mb' }));

// Enhanced logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize routes immediately for serverless
let serverInitialized = false;

export async function initializeServer() {
  if (serverInitialized) return app;
  
  try {
    log('Initializing serverless function...');
    await registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
    });

    // For production/serverless, serve static files
    if (process.env.NODE_ENV === "production") {
      log('Setting up static file serving...');
      serveStatic(app);
    }

    serverInitialized = true;
    log('Server initialization completed!');
    return app;
  } catch (error) {
    console.error('Failed to initialize server:', error);
    throw error;
  }
}