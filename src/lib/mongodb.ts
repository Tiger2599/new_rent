import { MongoClient, Db } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGO_MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGO_MONGODB_URI environment variable.");
  }

  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri);
  const promise = client.connect();

  if (process.env.NODE_ENV !== "production") {
    global._mongoClientPromise = promise;
  }

  return promise;
}

export async function getDb(): Promise<Db> {
  const connected = await getClientPromise();
  return connected.db("rent");
}

export const collections = {
  users: "users",
  tenants: "tenants",
  rentPayments: "rent_payments",
  ledger: "ledger",
} as const;

export const noId = { projection: { _id: 0 } } as const;
