import { db } from "./db";
import { users, uploads, type User, type InsertUser, type Upload, type InsertUpload } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

import cloudinary from './cloudinary';

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;

  createUpload(upload: InsertUpload): Promise<Upload>;
  getUpload(id: number): Promise<Upload | undefined>;
  getUploads(filter?: { folder?: string }): Promise<Upload[]>; // For admin
  getPublicUploads(): Promise<Upload[]>; // For public
  updateUpload(id: number, upload: Partial<InsertUpload>): Promise<Upload>;
  deleteUpload(id: number): Promise<void>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async createUpload(insertUpload: Omit<InsertUpload, 'driveFileId' | 'webViewLink' | 'thumbnailLink'> & { driveFileId: string; webViewLink: string; thumbnailLink: string }): Promise<Upload> {
    const [upload] = await db.insert(uploads).values(insertUpload).returning();
    return upload;
  }

  async uploadToCloudinary(fileBuffer: Buffer, folder: string) {
    try {
      // Convert buffer to temporary file or use data URL for upload
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: folder,
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        stream.end(fileBuffer);
      });
      
      return {
        publicId: result.public_id,
        secureUrl: result.secure_url,
        thumbnailUrl: result.thumbnail_url || result.secure_url,
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  async deleteFromCloudinary(publicId: string) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      throw error;
    }
  }

  async getUpload(id: number): Promise<Upload | undefined> {
    const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
    return upload;
  }

  async getUploads(filter?: { folder?: string }): Promise<Upload[]> {
    let query = db.select().from(uploads).orderBy(desc(uploads.createdAt));
    
    if (filter?.folder) {
      query.where(eq(uploads.folderName, filter.folder));
    }
    
    return await query;
  }

  async getPublicUploads(): Promise<Upload[]> {
    // In a real app we might have a 'published' flag, but here all uploads are public
    // effectively, just without the private text (which is handled by the API response or frontend)
    // The requirement says "Visible to everyone on the public website".
    return await db.select().from(uploads).orderBy(desc(uploads.createdAt));
  }

  async updateUpload(id: number, updates: Partial<InsertUpload>): Promise<Upload> {
    const [upload] = await db.update(uploads).set(updates).where(eq(uploads.id, id)).returning();
    return upload;
  }

  async deleteUpload(id: number): Promise<void> {
    await db.delete(uploads).where(eq(uploads.id, id));
  }
}

export const storage = new DatabaseStorage();
