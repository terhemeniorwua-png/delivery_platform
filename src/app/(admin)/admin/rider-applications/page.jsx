import AdminApplications from "./AdminApplications";
import { normalizeSearchParams } from "@/lib/url";

export const metadata = {
  title: "Rider applications",
  robots: { index: false },
};

export default async function RiderApplicationsPage({ searchParams }) {
  const current = normalizeSearchParams(await searchParams);
  return <AdminApplications current={current} />;
}