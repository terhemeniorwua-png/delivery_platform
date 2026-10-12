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

const SOCIAL_LINKS = [
  {
    href: "https://x.com/PIorwua12080",
    label: "X (Twitter)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: "https://www.linkedin.com/feed/",
    label: "LinkedIn",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    href: "https://www.facebook.com/philip.iorwua.9",
    label: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="size-5" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
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
          <ul className="mt-4 flex items-center gap-3">
            {SOCIAL_LINKS.map((social) => (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex size-9 items-center justify-center rounded-full bg-white/10 text-sky-200/80 transition-colors hover:bg-white/20 hover:text-white"
                >
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
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
