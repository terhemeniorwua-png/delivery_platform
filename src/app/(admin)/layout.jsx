import AdminLayout from "@/components/layouts/AdminLayout";

/** Guarded shell for the whole admin area (/admin…). */
export default function Layout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}