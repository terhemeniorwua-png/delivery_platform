import AdminRiderDetail from "./AdminRiderDetail";

export const metadata = {
  title: "Rider details",
  robots: { index: false },
};

export default async function AdminRiderPage({ params }) {
  const { id } = await params;
  return <AdminRiderDetail riderId={id} />;
}