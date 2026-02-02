import { storage } from "../server/storage";

async function seed() {
  const existing = await storage.getUserByUsername("admin");
  if (!existing) {
    console.log("Creating admin user...");
    await storage.createUser({ username: "admin", password: "0777" });
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
  }
}

seed().catch(console.error);
