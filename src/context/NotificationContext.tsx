"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
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

const SWIPE_CLOSE_PX = 70;

function Toast({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: (id: number) => void;
}) {
  const startX = useRef<number | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    startX.current = event.touches[0]?.clientX ?? null;
    setDragging(true);
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (startX.current == null) return;
    const x = event.touches[0]?.clientX;
    if (x == null) return;
    setDragX(x - startX.current);
  }

  function onTouchEnd() {
    if (Math.abs(dragX) >= SWIPE_CLOSE_PX) {
      onClose(notification.id);
      return;
    }
    startX.current = null;
    setDragging(false);
    setDragX(0);
  }

  return (
    <div
      role="status"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        transform: `translateX(${dragX}px)`,
        opacity: Math.max(0.35, 1 - Math.abs(dragX) / 220),
        transition: dragging ? "none" : "transform 160ms ease, opacity 160ms ease",
      }}
      className={`pointer-events-auto flex items-start gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
        notification.type === "error"
          ? "bg-red-600 text-white"
          : "bg-gray-800 text-white"
      }`}
    >
      <p className="min-w-0 flex-1">{notification.message}</p>
      <button
        type="button"
        aria-label="Close notification"
        onClick={() => onClose(notification.id)}
        className="shrink-0 rounded px-1 text-lg leading-none text-white/80 hover:text-white"
      >
        ×
      </button>
    </div>
  );
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timers = useRef<Map<number, number>>(new Map());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const push = useCallback(
    (type: NotificationType, message: string) => {
      const id = nextId.current++;
      setNotifications((prev) => [...prev, { id, type, message }]);
      const timer = window.setTimeout(() => dismiss(id), 4000);
      timers.current.set(id, timer);
    },
    [dismiss],
  );

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
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(100%-2rem,24rem)] flex-col gap-2">
        {notifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={dismiss}
          />
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
