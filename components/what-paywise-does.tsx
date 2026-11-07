const steps = [
  "Search",
  "Compare",
  "Price history",
  "Buy or wait",
  "Alerts",
  "Checkout",
  "Watchlist",
  "Wallet",
];

export function WhatPaywiseDoes() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid items-center gap-6 sm:grid-cols-[168px_minmax(0,1fr)] sm:gap-2">
        <div className="relative hidden self-stretch sm:block">
          <h2 className="absolute left-0 top-[32%] -translate-y-1/2 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
            You
          </h2>
          <svg
            viewBox="0 0 72 400"
            preserveAspectRatio="none"
            className="absolute inset-y-1 right-0 w-16"
            aria-hidden
          >
            <path d="M8 128 C 40 128, 40 28, 68 28" fill="none" stroke="#1c1917" strokeWidth="1.6" />
            <path d="M8 128 C 40 128, 40 300, 68 300" fill="none" stroke="#1c1917" strokeWidth="1.6" />
            <circle cx="8" cy="128" r="5" fill="#1c1917" />
          </svg>
        </div>
        <h2 className="text-4xl font-semibold tracking-tight text-stone-900 sm:hidden">You</h2>

        <div className="space-y-8">
          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] text-stone-400">ALREADY</p>
            <div className="mt-3 flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4">
              <div>
                <p className="text-lg font-semibold text-stone-900">One store at a time</p>
                <p className="mt-1 text-sm text-stone-500">
                  Each retailer shows only its own price. You compare them yourself.
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-medium tracking-[0.18em] text-stone-400">THE PAYWISE WAY</p>
            <div className="mt-3 rounded-xl border border-[#d9e2f2] bg-[#f3f6fb] px-5 py-5">
              <p className="text-xl font-semibold tracking-tight text-stone-900">Paywise</p>
              <p className="mt-4 text-lg font-semibold text-stone-900">Compare, then decide</p>
              <p className="mt-1 max-w-xl text-sm leading-6 text-stone-600">
                See every offer in one place, check whether the price is low, and check out here.
              </p>
              <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {steps.map((step) => (
                  <li
                    key={step}
                    className="rounded-md border border-stone-200 bg-white px-3 py-2 text-center text-sm font-medium text-stone-800"
                  >
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
