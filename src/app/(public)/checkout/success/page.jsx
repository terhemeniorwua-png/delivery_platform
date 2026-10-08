import SuccessView from "./SuccessView";

export const metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function CheckoutSuccessPage({ searchParams }) {
  const params = await searchParams;
  const orderId = typeof params?.order === "string" ? params.order : null;
  return <SuccessView orderId={orderId} />;
}
