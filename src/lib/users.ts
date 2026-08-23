import type { Collection } from "mongodb";
import { collections, getDb, noId } from "@/lib/mongodb";
import type { UserRole } from "@/lib/auth";

export type UserRecord = {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  ownerId: string;
  createdAt: string;
};

export type PublicUser = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  ownerId: string;
  createdAt?: string;
};

function toPublic(user: UserRecord): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "owner" ? "owner" : "admin",
    ownerId: user.ownerId,
    createdAt: user.createdAt,
  };
}

let legacyStampDone = false;

async function splitSharedOwnerAccounts(
  usersCol: Collection<UserRecord>,
): Promise<void> {
  const latest = await usersCol.find({}, noId).sort({ id: 1 }).toArray();
  const ownersBySpace = new Map<string, UserRecord[]>();

  for (const user of latest) {
    if (!user.ownerId || user.role !== "owner") continue;
    const list = ownersBySpace.get(user.ownerId) ?? [];
    list.push(user);
    ownersBySpace.set(user.ownerId, list);
  }

  for (const group of ownersBySpace.values()) {
    if (group.length < 2) continue;
    group.sort((a, b) => a.id - b.id);
    for (const extra of group.slice(1)) {
      await usersCol.updateOne(
        { id: extra.id },
        { $set: { ownerId: crypto.randomUUID(), role: "owner" } },
      );
    }
  }
}

/**
 * Rows with no ownerId belong to the first user by id (original personal account).
 * Later Register owners keep their own ownerId.
 * If two owners share one ownerId, extras get a new empty workspace.
 */
export async function backfillLegacyOwners(): Promise<void> {
  const db = await getDb();
  const usersCol = db.collection<UserRecord>(collections.users);

  if (!legacyStampDone) {
    const users = await usersCol.find({}, noId).sort({ id: 1 }).toArray();
    if (users.length === 0) {
      legacyStampDone = true;
      return;
    }

    const original = users[0];
    const legacyOwnerId = original.ownerId || crypto.randomUUID();

    if (!original.ownerId) {
      await usersCol.updateOne(
        { id: original.id },
        { $set: { ownerId: legacyOwnerId, role: "owner" } },
      );
    }

    await usersCol.updateMany(
      { ownerId: { $exists: false } },
      { $set: { ownerId: legacyOwnerId, role: "admin" } },
    );

    const ownerFilter = { ownerId: { $exists: false } };
    await Promise.all([
      db.collection(collections.tenants).updateMany(ownerFilter, {
        $set: { ownerId: legacyOwnerId },
      }),
      db.collection(collections.rentPayments).updateMany(ownerFilter, {
        $set: { ownerId: legacyOwnerId },
      }),
      db.collection(collections.ledger).updateMany(ownerFilter, {
        $set: { ownerId: legacyOwnerId },
      }),
    ]);

    legacyStampDone = true;
  }

  await splitSharedOwnerAccounts(usersCol);
}

export async function getPublicUsers(ownerId: string): Promise<PublicUser[]> {
  await backfillLegacyOwners();
  const db = await getDb();
  const users = await db
    .collection<UserRecord>(collections.users)
    .find({ ownerId }, noId)
    .sort({ id: 1 })
    .toArray();

  return users.map(toPublic);
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  await backfillLegacyOwners();
  const db = await getDb();
  return db.collection<UserRecord>(collections.users).findOne({ id }, noId);
}

export async function findUserByCredentials(
  email: string,
  password: string,
): Promise<UserRecord | null> {
  await backfillLegacyOwners();
  const db = await getDb();
  return db.collection<UserRecord>(collections.users).findOne(
    {
      email: email.toLowerCase(),
      password,
    },
    noId,
  );
}

export async function findUserByEmail(
  email: string,
): Promise<UserRecord | null> {
  const db = await getDb();
  return db.collection<UserRecord>(collections.users).findOne(
    { email: email.toLowerCase() },
    noId,
  );
}

async function nextUserId(): Promise<number> {
  const db = await getDb();
  const last = await db
    .collection<UserRecord>(collections.users)
    .find({}, noId)
    .sort({ id: -1 })
    .limit(1)
    .toArray();
  return (last[0]?.id ?? 0) + 1;
}

export async function registerOwner(input: {
  name: string;
  email: string;
  password: string;
}): Promise<PublicUser> {
  const db = await getDb();
  const col = db.collection<UserRecord>(collections.users);

  const existing = await col.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const user: UserRecord = {
    id: await nextUserId(),
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    role: "owner",
    ownerId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  await col.insertOne(user);
  return toPublic(user);
}

export async function createSubUser(input: {
  name: string;
  email: string;
  password: string;
  ownerId: string;
}): Promise<PublicUser> {
  const db = await getDb();
  const col = db.collection<UserRecord>(collections.users);

  const existing = await col.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const user: UserRecord = {
    id: await nextUserId(),
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    role: "admin",
    ownerId: input.ownerId,
    createdAt: new Date().toISOString(),
  };

  await col.insertOne(user);
  return toPublic(user);
}

export async function deleteUser(
  id: number,
  ownerId: string,
  actorId: number,
): Promise<boolean> {
  const db = await getDb();
  const col = db.collection<UserRecord>(collections.users);

  const target = await col.findOne({ id, ownerId }, noId);
  if (!target) return false;

  if (target.id === actorId) {
    throw new Error("You cannot delete your own account.");
  }

  if (target.role === "owner") {
    throw new Error("Cannot delete the owner account.");
  }

  const result = await col.deleteOne({ id, ownerId });
  return result.deletedCount === 1;
}
