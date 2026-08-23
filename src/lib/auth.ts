export type UserRole = "owner" | "admin";

export type User = {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  ownerId: string;
};

/** Persists until user clicks Logout. Survives refresh and browser restart. */
const AUTH_KEY = "rent_auth_user";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw) as User;
    if (!user?.id || !user?.email || !user?.ownerId) return null;
    return {
      ...user,
      role: user.role === "owner" ? "owner" : "admin",
    };
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  window.localStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role === "owner" ? "owner" : "admin",
      ownerId: user.ownerId,
    }),
  );
}

export function clearStoredUser(): void {
  window.localStorage.removeItem(AUTH_KEY);
}

export function toPublicUser(user: User): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role === "owner" ? "owner" : "admin",
    ownerId: user.ownerId,
  };
}
