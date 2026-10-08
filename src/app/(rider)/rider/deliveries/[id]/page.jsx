import RiderDeliveryDetail from "./RiderDeliveryDetail";

export const metadata = {
  title: "Delivery details",
  robots: { index: false },
};

export default async function RiderDeliveryPage({ params }) {
  const { id } = await params;
  return <RiderDeliveryDetail deliveryId={id} />;
}