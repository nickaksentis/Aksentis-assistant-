import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { familyMembers } from "./schema";

async function seed() {
  const client = createClient({
    url: process.env.DATABASE_URL || "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client);

  console.log("Seeding family members...");

  await db.insert(familyMembers).values([
    { name: "Nick", phone: "+10000000000", pin: "1234", isAdmin: true },
    { name: "Partner", phone: "+10000000001", pin: "1234", isAdmin: false },
  ]);

  console.log("Seed complete! Default PIN for all members: 1234");
  process.exit(0);
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
