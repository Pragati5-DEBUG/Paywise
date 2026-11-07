import Link from "next/link";
import { PaywiseLogo } from "@/components/paywise-logo";

const links = [
  { href: "/watchlist", label: "Watchlist" },
  { href: "/wallet", label: "Wallet" },
  { href: "/savings", label: "Savings" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between gap-6 px-5 sm:h-24">
        <Link href="/" className="text-stone-900">
          <PaywiseLogo markClassName="h-12 w-12" wordClassName="text-2xl" />
        </Link>
        <nav className="flex items-center gap-6 text-base text-stone-600 sm:gap-8 sm:text-lg">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-stone-900">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
