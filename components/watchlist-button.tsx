"use client";

import { useEffect, useState } from "react";

export function WatchlistButton({
  productId,
  title,
  brand,
  imageUrl,
  lowestPrice,
}: {
  productId: string;
  title: string;
  brand: string;
  imageUrl: string | null;
  lowestPrice: number | null;
}) {
  const [watched, setWatched] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/watchlist");
        const data = (await res.json()) as {
          items?: { productId: string }[];
        };
        if (cancelled) return;
        setWatched(Boolean(data.items?.some((i) => i.productId === productId)));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function toggle() {
    setPending(true);
    try {
      if (watched) {
        await fetch(`/api/watchlist?productId=${encodeURIComponent(productId)}`, {
          method: "DELETE",
        });
        setWatched(false);
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId,
            title,
            brand,
            imageUrl,
            lowestPrice,
          }),
        });
        setWatched(true);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="mt-4 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-800 hover:border-stone-500 disabled:opacity-60"
    >
      {pending ? "Saving…" : watched ? "Remove from watchlist" : "Add to watchlist"}
    </button>
  );
}
