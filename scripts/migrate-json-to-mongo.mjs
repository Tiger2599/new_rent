import { readFileSync } from "fs";
import path from "path";
import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGO_MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGO_MONGODB_URI");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("rent");

  const dataDir = path.join(process.cwd(), "data");

  function readJson(filename) {
    try {
      return JSON.parse(readFileSync(path.join(dataDir, filename), "utf-8"));
    } catch {
      return [];
    }
  }

  const users = readJson("users.json");
  const tenants = readJson("tenants.json");
  const oldTenants = readJson("old-tenants.json");
  const rentPayments = readJson("rent-payments.json");
  const ledger = readJson("ledger.json");

  const usersCol = db.collection("users");
  const tenantsCol = db.collection("tenants");
  const rentCol = db.collection("rent_payments");
  const ledgerCol = db.collection("ledger");

  await usersCol.createIndex({ email: 1 }, { unique: true });
  await tenantsCol.createIndex({ id: 1 }, { unique: true });
  await rentCol.createIndex({ id: 1 }, { unique: true });
  await rentCol.createIndex({ tenantId: 1, rentMonth: 1 });
  await ledgerCol.createIndex({ id: 1 }, { unique: true });

  async function upsertMany(col, docs, key) {
    for (const doc of docs) {
      await col.updateOne({ [key]: doc[key] }, { $set: doc }, { upsert: true });
    }
  }

  await upsertMany(usersCol, users, "email");
  await upsertMany(tenantsCol, tenants, "id");
  await upsertMany(tenantsCol, oldTenants, "id");
  await upsertMany(rentCol, rentPayments, "id");
  await upsertMany(ledgerCol, ledger, "id");

  const allUsers = await usersCol.find({}).toArray();
  for (const user of allUsers) {
    if (typeof user.email === "string") {
      await usersCol.updateOne(
        { _id: user._id },
        { $set: { email: user.email.toLowerCase() } },
      );
    }
  }

  console.log("Migration complete:");
  console.log(`  users: ${await usersCol.countDocuments()}`);
  console.log(`  tenants: ${await tenantsCol.countDocuments()}`);
  console.log(`  rent_payments: ${await rentCol.countDocuments()}`);
  console.log(`  ledger: ${await ledgerCol.countDocuments()}`);

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
