import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const uploads = pgTable("uploads", {
  id: serial("id").primaryKey(),
  publicText: text("public_text").notNull(),
  privateText: text("private_text"), // Nullable as it might not always be filled? Requirements say "Enter two text fields", implies both are input. But maybe private is optional? Let's make it optional in schema but required in UI if needed. User said "Used for internal notes", usually optional.
  folderName: text("folder_name").notNull().default("General"),
  driveFileId: text("drive_file_id").notNull(),
  webViewLink: text("web_view_link").notNull(), // Public link to view
  thumbnailLink: text("thumbnail_link"), // For grid view
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users);
export const insertUploadSchema = createInsertSchema(uploads).omit({ 
  id: true, 
  createdAt: true,
  driveFileId: true,
  webViewLink: true,
  thumbnailLink: true
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Upload = typeof uploads.$inferSelect;
export type InsertUpload = z.infer<typeof insertUploadSchema>;
