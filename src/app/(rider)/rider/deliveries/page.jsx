import RiderDeliveries from "./RiderDeliveries";
import { normalizeSearchParams } from "@/lib/url";

export const metadata = {
  title: "My deliveries",
  robots: { index: false },
};

export default async function RiderDeliveriesPage({ searchParams }) {
  const current = normalizeSearchParams(await searchParams);
  return <RiderDeliveries current={current} />;
}