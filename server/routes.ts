import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import multer from "multer";
import express from "express";

import passport from "passport";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Use memory storage for multer to handle file uploads to Cloudinary
  const upload = multer({ storage: multer.memoryStorage() });

  // Note: Static file serving is not needed since we're using Cloudinary for image storage

  // Setup Authentication
  setupAuth(app);

  // === Auth Routes ===
  app.post(api.auth.login.path, (req, res, next) => {
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
          const user = await storage.getUser((req.user as any).id);
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

      // Upload to Cloudinary
      const uploadResult = await storage.uploadToCloudinary(req.file.buffer, 'drive-content-hub/' + (req.body.folderName || 'General'));
      
      // Parse body fields
      const publicText = req.body.publicText || "";
      const privateText = req.body.privateText || "";
      const folderName = req.body.folderName || "General";

      const newUpload = await storage.createUpload({
        publicText,
        privateText,
        folderName,
        driveFileId: uploadResult.publicId, // Cloudinary public ID
        webViewLink: uploadResult.secureUrl,
        thumbnailLink: uploadResult.thumbnailUrl,
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
      // First get the upload to retrieve the Cloudinary public ID
      const uploadToDelete = await storage.getUpload(id);
      if (!uploadToDelete) {
        return res.status(404).json({ message: "Upload not found" });
      }
      
      // Delete from Cloudinary
      await storage.deleteFromCloudinary(uploadToDelete.driveFileId);
      
      // Delete from database
      await storage.deleteUpload(id);
      
      res.sendStatus(204);
    } catch (err) {
      res.status(404).json({ message: "Upload not found" });
    }
  });

  // Test Cloudinary connection endpoint
  app.get('/api/test-cloudinary', async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // Try to ping Cloudinary
      const pingResult = await import('./cloudinary').then(mod => mod.default.api.ping());
      res.json({ success: true, message: 'Cloudinary connection successful', pingResult });
    } catch (error) {
      console.error('Cloudinary test error:', error);
      res.status(500).json({ success: false, message: 'Cloudinary connection failed', error: (error as Error).message });
    }
  });

  return httpServer;
}
