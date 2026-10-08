import RiderLayout from "@/components/layouts/RiderLayout";

/** Guarded shell for the whole rider area (/rider…). */
export default function Layout({ children }) {
  return <RiderLayout>{children}</RiderLayout>;
}