import { MongoClient, Db, type IndexDescription } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  // eslint-disable-next-line no-var
  var _mongoIndexesReady: Promise<void> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGO_MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGO_MONGODB_URI environment variable.");
  }

  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  const client = new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 1,
    maxIdleTimeMS: 60_000,
    serverSelectionTimeoutMS: 8_000,
    connectTimeoutMS: 8_000,
    socketTimeoutMS: 45_000,
    retryWrites: true,
  });

  // Cache across hot reloads (dev) and warm serverless instances (prod)
  global._mongoClientPromise = client.connect();
  return global._mongoClientPromise;
}

async function ensureIndexes(db: Db): Promise<void> {
  if (global._mongoIndexesReady) {
    return global._mongoIndexesReady;
  }

  global._mongoIndexesReady = (async () => {
    const indexes: Array<{ collection: string; specs: IndexDescription[] }> = [
      {
        collection: collections.tenants,
        specs: [
          { key: { id: 1 }, unique: true, name: "tenants_id_unique" },
          { key: { removedAt: 1, createdAt: -1 }, name: "tenants_active_list" },
          { key: { removedAt: -1 }, name: "tenants_old_list" },
          { key: { name: 1 }, name: "tenants_name" },
          { key: { mobile: 1 }, name: "tenants_mobile" },
          {
            key: { buildingNumber: 1, roomNumber: 1 },
            name: "tenants_building_room",
          },
        ],
      },
      {
        collection: collections.rentPayments,
        specs: [
          { key: { id: 1 }, unique: true, name: "rent_id_unique" },
          {
            key: { tenantId: 1, receivedDate: -1, createdAt: -1 },
            name: "rent_by_tenant",
          },
          {
            key: { tenantId: 1, rentMonth: 1, type: 1 },
            name: "rent_month_type",
          },
          { key: { receivedDate: -1, createdAt: -1 }, name: "rent_by_date" },
        ],
      },
      {
        collection: collections.ledger,
        specs: [
          { key: { id: 1 }, unique: true, name: "ledger_id_unique" },
          { key: { date: -1, createdAt: -1 }, name: "ledger_by_date" },
          { key: { type: 1, date: -1 }, name: "ledger_by_type" },
        ],
      },
      {
        collection: collections.users,
        specs: [
          { key: { id: 1 }, unique: true, name: "users_id_unique" },
          { key: { email: 1 }, unique: true, name: "users_email_unique" },
        ],
      },
    ];

    await Promise.all(
      indexes.map(({ collection, specs }) =>
        db.collection(collection).createIndexes(specs),
      ),
    );
  })().catch((error) => {
    global._mongoIndexesReady = undefined;
    throw error;
  });

  return global._mongoIndexesReady;
}

export async function getDb(): Promise<Db> {
  const connected = await getClientPromise();
  const db = connected.db("rent");
  if (!global._mongoIndexesReady) {
    void ensureIndexes(db).catch((err) => {
      console.error("MongoDB index ensure failed:", err);
    });
  }
  return db;
}

export const collections = {
  users: "users",
  tenants: "tenants",
  rentPayments: "rent_payments",
  ledger: "ledger",
} as const;

export const noId = { projection: { _id: 0 } } as const;

/** Lightweight tenant fields for lists / balance sheet name lookup */
export const tenantListProjection = {
  projection: {
    _id: 0,
    id: 1,
    name: 1,
    mobile: 1,
    buildingNumber: 1,
    roomNumber: 1,
    deposit: 1,
    advance: 1,
    rent: 1,
    rentStartFrom: 1,
    note: 1,
    createdAt: 1,
    removedAt: 1,
  },
} as const;

export const tenantNameProjection = {
  projection: { _id: 0, id: 1, name: 1 },
} as const;
