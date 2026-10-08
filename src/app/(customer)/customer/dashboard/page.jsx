import { redirect } from "next/navigation";

export const metadata = {
  title: "Dashboard",
};

/** Canonical customer dashboard lives at /customer (RoleGate + nav target). */
export default function CustomerDashboardAlias() {
  redirect("/customer");
}
