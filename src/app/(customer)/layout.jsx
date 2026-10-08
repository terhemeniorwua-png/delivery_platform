import CustomerLayout from "@/components/layouts/CustomerLayout";

/** Guarded shell for the whole customer area (/customer…). */
export default function Layout({ children }) {
  return <CustomerLayout>{children}</CustomerLayout>;
}