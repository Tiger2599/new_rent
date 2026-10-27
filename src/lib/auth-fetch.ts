import { getStoredUser } from "@/lib/auth";

function isAuthPublicUrl(url: string) {
  return (
    url.includes("/api/auth/login") || url.includes("/api/auth/register")
  );
}

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

let patched = false;

/** Install once on the client so API calls always send x-user-id after login. */
export function ensureAuthFetch() {
  if (typeof window === "undefined" || patched) return;
  patched = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveUrl(input);
    const stored = getStoredUser();
    const headers = new Headers(
      init?.headers ??
        (input instanceof Request ? input.headers : undefined),
    );

    if (stored && url.includes("/api/") && !isAuthPublicUrl(url)) {
      headers.set("x-user-id", String(stored.id));
    }

    if (input instanceof Request) {
      return originalFetch(new Request(input, { ...init, headers }));
    }

    return originalFetch(input, { ...init, headers });
  };
}
