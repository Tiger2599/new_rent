"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type NotificationType = "error" | "success";

type Notification = {
  id: number;
  type: NotificationType;
  message: string;
};

type NotificationContextValue = {
  notifyError: (message: string) => void;
  notifySuccess: (message: string) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const push = useCallback((type: NotificationType, message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  const notifyError = useCallback(
    (message: string) => push("error", message),
    [push],
  );

  const notifySuccess = useCallback(
    (message: string) => push("success", message),
    [push],
  );

  const value = useMemo(
    () => ({ notifyError, notifySuccess }),
    [notifyError, notifySuccess],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
              n.type === "error"
                ? "bg-red-600 text-white"
                : "bg-gray-800 text-white"
            }`}
          >
            {n.message}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within NotificationProvider");
  }
  return ctx;
}
