import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";

/**
 * Shell for all public pages (home, shop, product, login, ...).
 * Used by app/(public)/layout.jsx — never wrap dashboards in this.
 *
 * `nav` / `actions` are slots filled by later phases (storefront links,
 * cart button, sign-in buttons).
 */
export default function PublicLayout({ children, nav = null, actions = null }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader nav={nav} actions={actions} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
