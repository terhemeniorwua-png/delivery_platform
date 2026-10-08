import Link from "next/link";
import Logo from "@/components/branding/Logo";

const SHOP_LINKS = [
  { href: "/shop", label: "All products" },
  { href: "/categories", label: "Categories" },
  { href: "/cart", label: "Your cart" },
];

const COMPANY_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact" },
];

const SUPPORT_LINKS = [
  { href: "/contact", label: "Customer support" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
];

function LinkColumn({ title, links }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-sm text-sky-200/70 transition-colors hover:text-sky-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-navy-900">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo href="/" size={32} onDark />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-sky-200/70">
            SKYClothe is an online clothing store with doorstep delivery —
            browse the catalogue, place an order and a rider brings it to you.
          </p>
        </div>

        <LinkColumn title="Shop" links={SHOP_LINKS} />
        <LinkColumn title="Company" links={COMPANY_LINKS} />
        <LinkColumn title="Support" links={SUPPORT_LINKS} />
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-sky-200/70 sm:flex-row sm:px-6">
          <p>&copy; {new Date().getFullYear()} SKYClothe Delivery Platform. All rights reserved.</p>
          <p>Clothing, delivered to your doorstep.</p>
        </div>
      </div>
    </footer>
  );
}
