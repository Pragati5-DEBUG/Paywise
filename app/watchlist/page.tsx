"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  RowStyleModule,
  type ColDef,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { dealGridTheme } from "@/lib/grid-theme";
import { DealCalendarWrapper } from "@/components/deal-calendar-wrapper";
import { usd } from "@/lib/utils";

const gridModules = [ClientSideRowModelModule, RowStyleModule];

ModuleRegistry.registerModules(gridModules);

type Row = {
  title: string;
  brand: string;
  price: number | null;
  productId: string;
};

export default function WatchlistPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/watchlist");
        const data = (await res.json()) as {
          items?: {
            productId: string;
            title: string;
            brand: string;
            lowestPrice: number | null;
          }[];
        };
        if (cancelled) return;
        setRows(
          (data.items ?? []).map((item) => ({
            title: item.title,
            brand: item.brand,
            price: item.lowestPrice,
            productId: item.productId,
          })),
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function removeRow(productId: string) {
    setRows((current) => current.filter((row) => row.productId !== productId));
    const res = await fetch(
      `/api/watchlist?productId=${encodeURIComponent(productId)}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      const again = await fetch("/api/watchlist");
      const body = (await again.json()) as {
        items?: {
          productId: string;
          title: string;
          brand: string;
          lowestPrice: number | null;
        }[];
      };
      setRows(
        (body.items ?? []).map((item) => ({
          title: item.title,
          brand: item.brand,
          price: item.lowestPrice,
          productId: item.productId,
        })),
      );
      throw new Error(data?.error || "Could not remove");
    }
  }

  const columnDefs: ColDef<Row>[] = useMemo(
    () => [
      { field: "title", headerName: "Product", flex: 2 },
      { field: "brand", headerName: "Brand", flex: 1 },
      {
        field: "price",
        headerName: "Lowest",
        flex: 1,
        valueFormatter: (p) =>
          p.value == null ? "—" : usd(Number(p.value)),
      },
      {
        colId: "remove",
        headerName: "",
        width: 120,
        sortable: false,
        cellRenderer: (params: { data?: Row }) => {
          if (!params.data) return null;
          const productId = params.data.productId;
          return (
            <button
              type="button"
              data-watchlist-remove=""
              className="rounded-full border border-stone-200 px-3 py-1 text-xs font-medium text-stone-700 hover:border-stone-400"
              onClick={(event) => {
                event.stopPropagation();
                void removeRow(productId);
              }}
            >
              Remove
            </button>
          );
        },
      },
    ],
    [],
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Watchlist</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        Your saved products, plus a calendar of alerts, AI buy windows, and checkouts.
      </p>

      <div className="deal-grid mt-6 h-[280px] overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-stone-500">Loading watchlist…</p>
        ) : rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="font-medium text-stone-900">No saved products yet</p>
            <p className="text-sm text-stone-500">
              Open a product and click <span className="font-medium">Add to watchlist</span>.
            </p>
            <Link href="/search?q=headphones" className="text-sm underline">
              Search headphones
            </Link>
          </div>
        ) : (
          <AgGridReact<Row>
            modules={gridModules}
            theme={dealGridTheme}
            headerHeight={42}
            rowHeight={48}
            suppressCellFocus
            rowData={rows}
            columnDefs={columnDefs}
            rowStyle={{ cursor: "pointer" }}
            onRowClicked={(event) => {
              const target = event.event?.target;
              if (target instanceof Element && target.closest("[data-watchlist-remove]")) {
                return;
              }
              if (event.data?.productId) {
                window.location.href = `/product/${event.data.productId}`;
              }
            }}
          />
        )}
      </div>

      <section className="mt-10">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Deal calendar</h2>
            <p className="mt-1 text-sm text-stone-500">
              Alerts, AI windows, and checkout history
            </p>
          </div>
          <p className="text-xs text-stone-400">Click an event to open the product</p>
        </div>
        <DealCalendarWrapper />
      </section>

      <Link href="/" className="mt-8 inline-block text-sm underline">
        Back home
      </Link>
    </main>
  );
}
