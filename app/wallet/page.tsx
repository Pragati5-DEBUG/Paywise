"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  RowStyleModule,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { dealGridTheme } from "@/lib/grid-theme";
import { usd } from "@/lib/utils";

const gridModules = [ClientSideRowModelModule, RowStyleModule];

ModuleRegistry.registerModules(gridModules);

type Row = {
  title: string;
  merchant: string;
  status: string;
  amount: number;
  paidAt: string;
  productId: string;
};

export default function WalletPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/purchases");
        const data = (await res.json()) as {
          purchases?: {
            title: string;
            merchant: string;
            status: string;
            amount: number;
            paidAt: string;
            productId: string;
          }[];
        };
        if (cancelled) return;
        setRows(
          (data.purchases ?? []).map((p) => ({
            title: p.title,
            merchant: p.merchant,
            status: p.status,
            amount: p.amount,
            paidAt: p.paidAt.slice(0, 10),
            productId: p.productId,
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

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.amount, 0),
    [rows],
  );

  const columnDefs: ColDef<Row>[] = useMemo(
    () => [
      { field: "title", headerName: "Product", flex: 2 },
      { field: "merchant", headerName: "Store", flex: 1.1 },
      {
        field: "status",
        headerName: "Status",
        flex: 1,
        cellRenderer: (params: ICellRendererParams<Row, string>) => (
          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-emerald-800">
            {(params.value ?? "").toLowerCase()}
          </span>
        ),
      },
      {
        field: "amount",
        headerName: "Paid",
        flex: 1,
        cellRenderer: (params: ICellRendererParams<Row, number>) => (
          <span className="font-semibold tabular-nums">{usd(Number(params.value))}</span>
        ),
      },
      { field: "paidAt", headerName: "Date", flex: 1 },
    ],
    [],
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Wallet</h1>
      <p className="mt-2 text-stone-600">
        Checkouts completed on Paywise.
      </p>
      <p className="mt-3 text-sm text-stone-500">
        {loading
          ? "Loading…"
          : rows.length
            ? `${rows.length} purchase(s) · ${usd(total)} total`
            : "No purchases yet"}
      </p>

      <div className="deal-grid mt-6 h-[320px] overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-stone-500">Loading purchases…</p>
        ) : rows.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
            <p className="font-medium text-stone-900">No payments yet</p>
            <p className="text-sm text-stone-500">
              Checkout from a product offers row to record a purchase here.
            </p>
            <Link href="/search?q=headphones" className="text-sm underline">
              Find a product
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
              if (event.data?.productId) {
                window.location.href = `/product/${event.data.productId}`;
              }
            }}
          />
        )}
      </div>
    </main>
  );
}
