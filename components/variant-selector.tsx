"use client";

import { useRouter } from "next/navigation";
import type { CatalogVariantOption } from "@/lib/catalog";

const OUT_OF_STOCK = new Set(["SoldOut", "OutOfStock", "Discontinued"]);

export function VariantSelector({
  productId,
  options,
  selected,
}: {
  productId: string;
  options: CatalogVariantOption[];
  selected: Record<string, string> | null;
}) {
  const router = useRouter();

  function select(optionName: string, value: CatalogVariantOption["values"][number]) {
    if (value.productId && value.productId !== productId) {
      router.push(`/product/${value.productId}`);
      return;
    }
    const next = { ...(selected ?? {}), [optionName]: value.label };
    const params = new URLSearchParams();
    for (const [name, label] of Object.entries(next)) {
      params.set(`option_${name}`, label);
    }
    router.push(`/product/${productId}?${params.toString()}`);
  }

  return (
    <div className="mt-6 space-y-4">
      {options.map((option) => (
        <div key={option.name}>
          <p className="text-sm font-medium text-stone-700">{option.name}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {option.values.map((value) => {
              const isSelected = selected?.[option.name] === value.label;
              const out =
                value.available != null && OUT_OF_STOCK.has(value.available);
              const notOffered = !value.exists;
              return (
                <button
                  key={value.label}
                  type="button"
                  onClick={() => select(option.name, value)}
                  className={`rounded-full px-3 py-1.5 text-sm ring-1 transition ${
                    isSelected
                      ? "bg-stone-900 text-white ring-stone-900"
                      : notOffered
                        ? "bg-stone-50 text-stone-400 ring-dashed ring-stone-300"
                        : out
                          ? "bg-white text-stone-400 line-through ring-stone-200"
                          : "bg-white text-stone-700 ring-stone-200 hover:ring-stone-400"
                  }`}
                >
                  {value.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
