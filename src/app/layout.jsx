import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/components/ui/Toast";
import CookieConsent from "@/components/ui/CookieConsent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "SKYClothe — Fashion delivered to your doorstep",
    template: "%s | SKYClothe",
  },
  description:
    "Shop clothing for men, women and kids — everyday wear, traditional outfits, shoes and accessories, delivered to your doorstep by our riders.",
};

/**
 * Root layout: fonts + global providers only. Page chrome (header/footer,
 * dashboards) lives in route-group layouts — (public), (customer), (rider),
 * (admin) — so areas never inherit each other's navigation.
 */
export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <ToastProvider>
            {children}
            <CookieConsent />
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
