import type { IPermissions } from './models/User';

const PERMISSION_KEYS: (keyof IPermissions)[] = [
  'properties', 'flats', 'tenants', 'rent', 'payments', 'expenses',
  'balanceSheet', 'notes', 'users', 'reports',
];

/** Default permissions per role */
export const ROLE_PERMISSIONS: Record<string, IPermissions> = {
  owner: {
    properties: true, flats: true, tenants: true, rent: true, payments: true,
    expenses: true, balanceSheet: true, notes: true, users: true, reports: true,
  },
  manager: {
    properties: true, flats: true, tenants: true, rent: true, payments: false,
    expenses: false, balanceSheet: false, notes: true, users: false, reports: true,
  },
  accountant: {
    properties: false, flats: false, tenants: false, rent: false, payments: true,
    expenses: true, balanceSheet: true, notes: true, users: false, reports: true,
  },
  viewer: {
    properties: true, flats: true, tenants: true, rent: true, payments: true,
    expenses: true, balanceSheet: true, notes: true, users: false, reports: true,
  },
};

export function canAccess(user: { role: string; permissions?: IPermissions }, permission: keyof IPermissions): boolean {
  if (user.role === 'owner') return true;
  const perms = user.permissions ?? {};
  return perms[permission] === true;
}

export function getEffectiveUserId(user: { _id: unknown; ownerId?: unknown }): string {
  return String(user.ownerId ?? user._id);
}
