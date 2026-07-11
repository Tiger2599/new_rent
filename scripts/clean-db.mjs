import { MongoClient } from "mongodb";

async function main() {
  const uri = process.env.MONGO_MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGO_MONGODB_URI");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("rent");

  const tenants = await db.collection("tenants").deleteMany({});
  const rentPayments = await db.collection("rent_payments").deleteMany({});
  const ledger = await db.collection("ledger").deleteMany({});

  console.log("Cleaned MongoDB collections:");
  console.log(`  tenants: removed ${tenants.deletedCount}`);
  console.log(`  rent_payments: removed ${rentPayments.deletedCount}`);
  console.log(`  ledger: removed ${ledger.deletedCount}`);
  console.log("  users: kept (so you can still login)");

  await client.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
