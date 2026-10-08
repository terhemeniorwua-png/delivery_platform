import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import { NavLinks, NavActions, CartButton } from "./SiteNav";

/**
 * Shell for all public pages (home, shop, product, auth...).
 * Used by app/(public)/layout.jsx — never wrap dashboards in this.
 *
 * Navigation is auth-aware and responsive:
 *   desktop — logo · Shop/Categories/About/Contact · search · cart · account
 *   mobile  — logo · cart · menu (drawer with actions + links)
 */
export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader nav={<NavLinks />} actions={<NavActions />} trailing={<CartButton />} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
