import type { ReactNode } from "react";

function Mark({
  label,
  children,
  viewBox,
}: {
  label: string;
  children: ReactNode;
  viewBox: string;
}) {
  return (
    <svg viewBox={viewBox} className="h-9 w-auto" role="img" aria-label={label}>
      {children}
    </svg>
  );
}

function AmazonLogo() {
  return (
    <Mark label="Amazon" viewBox="0 0 156 48">
      <text x="2" y="28" fill="#232f3e" fontFamily="Arial, sans-serif" fontSize="26" fontWeight="700">
        amazon
      </text>
      <path d="M22 32c28 16 78 16 108-6" fill="none" stroke="#ff9900" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M122 22l12 6-16 4" fill="#ff9900" />
    </Mark>
  );
}

function WalmartLogo() {
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <Mark label="Walmart" viewBox="0 0 40 40">
      {petals.map((angle) => (
        <ellipse
          key={angle}
          cx="20"
          cy="8"
          rx="3.2"
          ry="6.2"
          fill="#ffc220"
          transform={`rotate(${angle} 20 20)`}
        />
      ))}
      <circle cx="20" cy="20" r="3.1" fill="#0071ce" />
    </Mark>
  );
}

function TargetLogo() {
  return (
    <Mark label="Target" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#cc0000" />
      <circle cx="20" cy="20" r="11" fill="#ffffff" />
      <circle cx="20" cy="20" r="6" fill="#cc0000" />
    </Mark>
  );
}

function BestBuyLogo() {
  return (
    <Mark label="Best Buy" viewBox="0 0 148 40">
      <path d="M6 4h118l16 16-16 16H6a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="#fff200" />
      <circle cx="18" cy="20" r="3.2" fill="#1c1917" />
      <text x="28" y="25" fill="#1c1917" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="800">
        BEST BUY
      </text>
    </Mark>
  );
}

function HomeDepotLogo() {
  return (
    <Mark label="Home Depot" viewBox="0 0 196 40">
      <rect width="196" height="40" rx="4" fill="#f96302" />
      <text x="12" y="26" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="800">
        THE HOME DEPOT
      </text>
    </Mark>
  );
}

function LowesLogo() {
  return (
    <Mark label="Lowe's" viewBox="0 0 92 40">
      <text x="0" y="28" fill="#004990" fontFamily="Georgia, serif" fontSize="28" fontWeight="700">
        Lowe&apos;s
      </text>
    </Mark>
  );
}

function MacysLogo() {
  return (
    <Mark label="Macy's" viewBox="0 0 40 40">
      <path
        d="M20 3l4.2 10.2L35 14.6l-8 6.6L29.2 33 20 27.4 10.8 33 13 21.2 5 14.6l10.8-1.4L20 3z"
        fill="#e21a2c"
      />
    </Mark>
  );
}

function NordstromLogo() {
  return (
    <Mark label="Nordstrom" viewBox="0 0 148 40">
      <text
        x="0"
        y="27"
        fill="#1c1917"
        fontFamily="Georgia, serif"
        fontSize="20"
        letterSpacing="1.5"
      >
        NORDSTROM
      </text>
    </Mark>
  );
}

function KohlsLogo() {
  return (
    <Mark label="Kohl's" viewBox="0 0 88 40">
      <text x="0" y="28" fill="#e31837" fontFamily="Georgia, serif" fontSize="28" fontStyle="italic" fontWeight="700">
        Kohl&apos;s
      </text>
    </Mark>
  );
}

function WayfairLogo() {
  return (
    <Mark label="Wayfair" viewBox="0 0 110 40">
      <text x="0" y="28" fill="#7b189f" fontFamily="Georgia, serif" fontSize="28" fontWeight="700">
        wayfair
      </text>
    </Mark>
  );
}

function EbayLogo() {
  return (
    <Mark label="eBay" viewBox="0 0 84 40">
      <text x="0" y="28" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="800">
        <tspan fill="#e53238">e</tspan>
        <tspan fill="#0064d2">b</tspan>
        <tspan fill="#f5af02">a</tspan>
        <tspan fill="#86b817">y</tspan>
      </text>
    </Mark>
  );
}

function CostcoLogo() {
  return (
    <Mark label="Costco" viewBox="0 0 156 40">
      <text x="0" y="28" fill="#e31837" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="800">
        COSTCO
      </text>
    </Mark>
  );
}

const stores = [
  AmazonLogo,
  WalmartLogo,
  TargetLogo,
  BestBuyLogo,
  HomeDepotLogo,
  LowesLogo,
  MacysLogo,
  NordstromLogo,
  KohlsLogo,
  WayfairLogo,
  EbayLogo,
  CostcoLogo,
];

export function StoreLogoRow() {
  return (
    <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-7">
      {stores.map((Logo, index) => (
        <li key={index} className="flex h-10 items-center">
          <Logo />
        </li>
      ))}
    </ul>
  );
}
