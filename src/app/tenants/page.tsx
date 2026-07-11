import { Suspense } from "react";
import TenantsPageContent from "./TenantsPageContent";

export default function TenantsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      }
    >
      <TenantsPageContent />
    </Suspense>
  );
}
