"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

export function CatalogFilters({
  initialMin,
  initialMax,
  initialInStock,
}: {
  initialMin?: number;
  initialMax?: number;
  initialInStock?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [min, setMin] = useState(initialMin?.toString() ?? "");
  const [max, setMax] = useState(initialMax?.toString() ?? "");
  const [inStock, setInStock] = useState(Boolean(initialInStock));

  function apply(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (min.trim()) params.set("min", min.trim());
    else params.delete("min");
    if (max.trim()) params.set("max", max.trim());
    else params.delete("max");
    if (inStock) params.set("stock", "1");
    else params.delete("stock");
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname);
    });
  }

  function clear() {
    setMin("");
    setMax("");
    setInStock(false);
    startTransition(() => router.push(pathname));
  }

  return (
    <form
      onSubmit={apply}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-4"
    >
      <label className="space-y-1 text-sm">
        <span className="text-stone-500">Min price</span>
        <input
          type="number"
          min={0}
          step="1"
          value={min}
          onChange={(e) => setMin(e.target.value)}
          placeholder="0"
          className="block w-28 rounded-xl border border-stone-200 px-3 py-2"
        />
      </label>
      <label className="space-y-1 text-sm">
        <span className="text-stone-500">Max price</span>
        <input
          type="number"
          min={0}
          step="1"
          value={max}
          onChange={(e) => setMax(e.target.value)}
          placeholder="Any"
          className="block w-28 rounded-xl border border-stone-200 px-3 py-2"
        />
      </label>
      <label className="mb-2 flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => setInStock(e.target.checked)}
          className="rounded border-stone-300"
        />
        In stock only
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Applying…" : "Apply"}
      </button>
      <button
        type="button"
        onClick={clear}
        className="rounded-xl border border-stone-200 px-4 py-2 text-sm text-stone-600"
      >
        Clear
      </button>
    </form>
  );
}
