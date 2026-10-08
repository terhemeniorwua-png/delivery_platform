import PublicLayout from "@/components/layouts/PublicLayout";

/** Shell for public pages: home, shop, product, auth. URL group: (public). */
export default function PublicRouteLayout({ children }) {
  return <PublicLayout>{children}</PublicLayout>;
}
