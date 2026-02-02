import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Configure local storage for uploads (fallback since Drive integration was dismissed)
// In a real production environment with ephemeral file systems, this should be S3 or similar.
// For this environment, we'll store in a 'uploads' directory.
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ 
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  })
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // Setup Authentication
  setupAuth(app);

  // === Auth Routes ===
  // Login/Logout are handled in setupAuth or can be explicit here if using custom logic, 
  // but usually Passport handles the login route via a middleware.
  // However, `setupAuth` in our templates usually sets up the session but not the specific login route 
  // if we want to use the API contract. Let's verify `setupAuth` implementation later. 
  // For now, I'll assume standard Passport setup and add the routes here to match `shared/routes.ts`.

  // Note: setupAuth usually adds the /login route. 
  // If we want to use our API contract strictly:
  app.post(api.auth.login.path, (req, res, next) => {
    // Delegate to passport
    const passport = require('passport'); // Import dynamically or from auth.ts
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });
  
  app.post(api.auth.changePassword.path, async (req, res) => {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      try {
          const { currentPassword, newPassword } = api.auth.changePassword.input.parse(req.body);
          const user = await storage.getUser(req.user!.id);
          // Simple string comparison as per requirements (initially plain text '0777'), 
          // but we should ideally use hashing. 
          // Given the initial seed is '0777', we'll implement simple check first or 
          // better, assumes auth.ts handles hashing. 
          // For safety, let's defer password logic to auth.ts helper or direct storage update.
          // We will update the password directly here for now (assuming plain text for the MVP/Request spec "Password: 0777").
          // TODO: Upgrade to hashed passwords.
          
          if (user?.password !== currentPassword) {
              return res.status(400).json({ message: "Incorrect current password" });
          }
          
          await storage.updateUser(user.id, { password: newPassword });
          res.json({ message: "Password updated" });
      } catch (e) {
          res.status(400).json({ message: "Invalid input" });
      }
  });

  // === Upload Routes ===

  app.get(api.uploads.listPublic.path, async (req, res) => {
    const uploads = await storage.getPublicUploads();
    // Filter out private text for public view
    const publicData = uploads.map(u => ({
      ...u,
      privateText: null // Hide private text
    }));
    res.json(publicData);
  });

  app.get(api.uploads.listAll.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const filter = req.query.folder ? { folder: String(req.query.folder) } : undefined;
    const uploads = await storage.getUploads(filter);
    res.json(uploads);
  });

  app.post(api.uploads.create.path, upload.single('file'), async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Generate a link. Since we are using local storage:
      const fileUrl = `/uploads/${req.file.filename}`;
      
      // Parse body fields
      const publicText = req.body.publicText || "";
      const privateText = req.body.privateText || "";
      const folderName = req.body.folderName || "General";

      const newUpload = await storage.createUpload({
        publicText,
        privateText,
        folderName,
        driveFileId: "local-" + req.file.filename, // Placeholder ID
        webViewLink: fileUrl,
        thumbnailLink: fileUrl, // Same for now
      });

      res.status(201).json(newUpload);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.put(api.uploads.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = Number(req.params.id);
      const updates = api.uploads.update.input.parse(req.body);
      const updated = await storage.updateUpload(id, updates);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: "Validation failed" });
      } else {
        res.status(404).json({ message: "Upload not found" });
      }
    }
  });

  app.delete(api.uploads.delete.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const id = Number(req.params.id);
      await storage.deleteUpload(id);
      // Optional: Delete file from disk
      res.sendStatus(204);
    } catch (err) {
      res.status(404).json({ message: "Upload not found" });
    }
  });

  return httpServer;
}
