import { collections, getDb, noId } from "@/lib/mongodb";

export type UserRecord = {
  id: number;
  email: string;
  password: string;
  name: string;
  role: "admin";
  createdAt: string;
};

export type PublicUser = {
  id: number;
  email: string;
  name: string;
  role: "admin";
  createdAt?: string;
};

export async function getUsers(): Promise<UserRecord[]> {
  const db = await getDb();
  return db
    .collection<UserRecord>(collections.users)
    .find({}, noId)
    .sort({ id: 1 })
    .toArray();
}

export async function getPublicUsers(): Promise<PublicUser[]> {
  const db = await getDb();
  return db
    .collection<PublicUser>(collections.users)
    .find(
      {},
      {
        projection: {
          _id: 0,
          id: 1,
          email: 1,
          name: 1,
          role: 1,
          createdAt: 1,
        },
      },
    )
    .sort({ id: 1 })
    .toArray()
    .then((users) =>
      users.map((u) => ({
        ...u,
        role: u.role ?? "admin",
      })),
    );
}

export async function findUserByCredentials(
  email: string,
  password: string,
): Promise<UserRecord | null> {
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

export async function createUser(input: {
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

  const last = await col.find({}, noId).sort({ id: -1 }).limit(1).toArray();
  const nextId = (last[0]?.id ?? 0) + 1;

  const user: UserRecord = {
    id: nextId,
    name: input.name,
    email: input.email.toLowerCase(),
    password: input.password,
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  await col.insertOne(user);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    createdAt: user.createdAt,
  };
}

export async function deleteUser(id: number): Promise<boolean> {
  const db = await getDb();
  const col = db.collection<UserRecord>(collections.users);
  const total = await col.countDocuments();

  if (total <= 1) {
    throw new Error("Cannot delete the last admin user.");
  }

  const result = await col.deleteOne({ id });
  return result.deletedCount === 1;
}
