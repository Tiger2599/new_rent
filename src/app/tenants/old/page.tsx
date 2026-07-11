import { redirect } from "next/navigation";

export default function OldTenantsRedirect() {
  redirect("/tenants?tab=old");
}
