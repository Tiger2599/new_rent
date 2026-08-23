import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "../types";

const USER_KEY = "rent_auth_user";
const API_KEY = "rent_api_url";

export const API_BASE_URL = "http://187.127.177.233:5000";

export function defaultApiUrl() {
  return process.env.EXPO_PUBLIC_API_URL || API_BASE_URL;
}

export async function getApiUrl() {
  const stored = await AsyncStorage.getItem(API_KEY);
  const url = stored?.trim() || defaultApiUrl();
  if (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("10.0.2.2") ||
    url.includes(":3000")
  ) {
    return defaultApiUrl();
  }
  return url;
}

export async function setApiUrl(url: string) {
  await AsyncStorage.setItem(API_KEY, url.trim().replace(/\/$/, ""));
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const user = JSON.parse(raw) as User;
    if (!user?.id || !user?.ownerId) return null;
    return user;
  } catch {
    return null;
  }
}

export async function setStoredUser(user: User) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearStoredUser() {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const [base, user] = await Promise.all([getApiUrl(), getStoredUser()]);
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (user && !path.startsWith("/api/auth/")) {
    headers.set("x-user-id", String(user.id));
  }

  const res = await fetch(`${base}${path}`, { ...options, headers });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}
