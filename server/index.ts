import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { sql } from "drizzle-orm";
import { db } from "./db";
import * as schema from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

/* ✅ SIMPLE WORKING CORS (fixes white screen issue) */
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

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
      log(logLine);
    }
  });

  next();
});

(async () => {
  // Synchronize the database schema on startup
  log("Synchronizing database schema...");
  try {
    // Attempt to run migrations if migration files exist
    try {
      await migrate(db, { migrationsFolder: "./migrations" });
      log("Database migrations applied.");
    } catch (migrationError: any) {
      log(`Migrations not found or failed: ${migrationError?.message || migrationError}. Attempting schema sync...`);
      // Fallback to schema synchronization
      await db.execute(sql`CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, username TEXT NOT NULL UNIQUE, password TEXT NOT NULL)`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS uploads (id SERIAL PRIMARY KEY, public_text TEXT NOT NULL, private_text TEXT, folder_name TEXT DEFAULT 'General', drive_file_id TEXT NOT NULL, web_view_link TEXT NOT NULL, thumbnail_link TEXT, created_at TIMESTAMP DEFAULT NOW())`);
      log("Database schema synchronized.");
    }
  } catch (error: any) {
    log(`Database setup error: ${error?.message || error}`);
    throw error;
  }
  
  // Register routes after database is ready
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  /* ✅ Railway-compatible server start */
  const port = parseInt(process.env.PORT || "5000", 10);

  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
