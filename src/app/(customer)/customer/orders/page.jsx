import OrdersView from "./OrdersView";
import { normalizeSearchParams } from "@/lib/url";

export const metadata = {
  title: "My orders",
  robots: { index: false },
};

export default async function CustomerOrdersPage({ searchParams }) {
  const current = normalizeSearchParams(await searchParams);
  return <OrdersView current={current} />;
}
