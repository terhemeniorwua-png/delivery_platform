import OrderDetailView from "./OrderDetailView";

export const metadata = {
  title: "Order details",
  robots: { index: false },
};

export default async function OrderDetailPage({ params }) {
  const { id } = await params;
  return <OrderDetailView orderId={id} />;
}
