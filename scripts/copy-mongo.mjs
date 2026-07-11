/**
 * Copy collections from Atlas (SOURCE) to the new self-hosted Mongo (TARGET).
 *
 * Usage:
 *   set SOURCE_MONGO_URI=<old atlas uri>
 *   npm run db:copy
 */
import { MongoClient } from "mongodb";

const SOURCE = process.env.SOURCE_MONGO_URI;
const TARGET = process.env.MONGO_MONGODB_URI;

const COLLECTIONS = ["users", "tenants", "rent_payments", "ledger"];

async function copyCollection(sourceDb, targetDb, name) {
  const docs = await sourceDb.collection(name).find({}).toArray();
  if (docs.length === 0) {
    console.log(`  ${name}: 0 docs (skip)`);
    return;
  }

  const target = targetDb.collection(name);
  await target.deleteMany({});
  await target.insertMany(docs, { ordered: false });
  console.log(`  ${name}: copied ${docs.length} docs`);
}

async function main() {
  if (!SOURCE) {
    throw new Error("Set SOURCE_MONGO_URI to the old MongoDB connection string.");
  }
  if (!TARGET) {
    throw new Error("Missing MONGO_MONGODB_URI.");
  }

  console.log("Connecting source...");
  const sourceClient = new MongoClient(SOURCE);
  console.log("Connecting target...");
  const targetClient = new MongoClient(TARGET);

  await Promise.all([sourceClient.connect(), targetClient.connect()]);

  const sourceDb = sourceClient.db("rent");
  const targetDb = targetClient.db("rent");

  console.log("Copying collections...");
  for (const name of COLLECTIONS) {
    await copyCollection(sourceDb, targetDb, name);
  }

  await Promise.all([sourceClient.close(), targetClient.close()]);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
