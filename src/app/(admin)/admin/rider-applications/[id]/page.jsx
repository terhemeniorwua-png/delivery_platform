import AdminApplicationDetail from "./AdminApplicationDetail";

export const metadata = {
  title: "Review application",
  robots: { index: false },
};

export default async function RiderApplicationPage({ params }) {
  const { id } = await params;
  return <AdminApplicationDetail applicationId={id} />;
}