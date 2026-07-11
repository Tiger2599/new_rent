"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { formatDate } from "@/lib/format";
import type { PublicUser } from "@/lib/users";

export default function AdminUsersPage() {
  const { user } = useAuth();
  const { notifyError, notifySuccess } = useNotification();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to load users.");
      return;
    }

    setUsers(data.users ?? []);
  }, [notifyError]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to create user.");
      return;
    }

    notifySuccess("Admin user created successfully.");
    setName("");
    setEmail("");
    setPassword("");
    await loadUsers();
  }

  async function handleDelete(target: PublicUser) {
    if (user?.id === target.id) {
      notifyError("You cannot delete your own account.");
      return;
    }

    if (users.length <= 1) {
      notifyError("Cannot delete the last admin user.");
      return;
    }

    setDeletingId(target.id);
    const res = await fetch(`/api/users/${target.id}`, { method: "DELETE" });
    const data = await res.json();
    setDeletingId(null);

    if (!res.ok) {
      notifyError(data.error ?? "Failed to delete user.");
      return;
    }

    notifySuccess("Admin user deleted.");
    await loadUsers();
  }

  return (
    <AuthGuard>
      <DashboardLayout title="Admin Users" backHref="/dashboard">
        <div className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Create Admin User
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                New users get full access to all features.
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Name *
              </span>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Email *
              </span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-gray-700">
                Password *
              </span>
              <input
                required
                type="password"
                minLength={4}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-gray-400 focus:bg-white"
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-gray-800 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create Admin"}
            </button>
          </form>

          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-900">All Admins</h3>
            </div>

            {loading ? (
              <p className="px-4 py-6 text-sm text-gray-500">Loading...</p>
            ) : users.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-500">No users yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isSelf = user?.id === u.id;
                  return (
                    <li
                      key={u.id}
                      className="flex items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {u.name}
                          {isSelf && (
                            <span className="ml-2 text-[10px] font-normal text-gray-400">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500">{u.email}</p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          Role: Admin
                          {u.createdAt ? ` · ${formatDate(u.createdAt)}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={isSelf || deletingId === u.id}
                        onClick={() => handleDelete(u)}
                        className="shrink-0 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deletingId === u.id ? "Deleting..." : "Delete"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
