import AdminUsers from "./AdminUsers";
import { normalizeSearchParams } from "@/lib/url";

export const metadata = {
  title: "Users",
  robots: { index: false },
};

export default async function AdminUsersPage({ searchParams }) {
  const current = normalizeSearchParams(await searchParams);
  return <AdminUsers current={current} />;
}