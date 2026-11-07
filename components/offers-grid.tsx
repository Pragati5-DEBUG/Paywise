"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ClientSideRowModelModule,
  ModuleRegistry,
  RowStyleModule,
  type ColDef,
  type ICellRendererParams,
} from "ag-grid-community";
import { AgGridReact } from "ag-grid-react";
import { dealGridTheme } from "@/lib/grid-theme";
import { offerLabel, type CatalogOffer } from "@/lib/catalog";
import { usd } from "@/lib/utils";

const gridModules = [ClientSideRowModelModule, RowStyleModule];

ModuleRegistry.registerModules(gridModules);

type Row = {
  merchant: string;
  price: number;
  label: string;
  lowest: boolean;
};

function StoreCell({ value }: ICellRendererParams<Row, string>) {
  return <span className="font-medium text-stone-900">{value}</span>;
}

function PriceCell({ value, data }: ICellRendererParams<Row, number>) {
  return (
    <span
      className={
        data?.lowest
          ? "font-semibold tabular-nums text-emerald-700"
          : "font-semibold tabular-nums text-stone-900"
      }
    >
      {usd(Number(value))}
    </span>
  );
}

function ComparedCell({ value }: ICellRendererParams<Row, string>) {
  if (!value) return null;
  const lowest = value === "Lowest";
  return (
    <span
      title={value}
      className={
        lowest
          ? "inline-flex max-w-full items-center truncate rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
          : "inline-flex max-w-full items-center truncate rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600"
      }
    >
      {value}
    </span>
  );
}

function BuyCell() {
  return (
    <span className="inline-flex items-center rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white">
      Buy
    </span>
  );
}

export function OffersGrid({
  productId,
  offers,
}: {
  productId: string;
  offers: CatalogOffer[];
}) {
  const router = useRouter();
  const sorted = useMemo(
    () => [...offers].sort((a, b) => a.price - b.price),
    [offers],
  );
  const lowest = sorted[0]?.price ?? 0;
  const cheapestMerchant = sorted[0]?.merchant ?? "";

  const rows: Row[] = sorted.map((offer) => ({
    merchant: offer.merchant,
    price: offer.price,
    label: offerLabel(offer.price, lowest, cheapestMerchant),
    lowest: offer.price === lowest,
  }));

  const columnDefs: ColDef<Row>[] = [
    { field: "merchant", headerName: "Store", flex: 1.4, minWidth: 140, cellRenderer: StoreCell },
    {
      field: "price",
      headerName: "Price",
      width: 112,
      minWidth: 100,
      flex: 0,
      cellRenderer: PriceCell,
    },
    { field: "label", headerName: "Compared", flex: 1, minWidth: 120, cellRenderer: ComparedCell },
    {
      colId: "buy",
      headerName: "",
      width: 84,
      minWidth: 84,
      sortable: false,
      cellRenderer: BuyCell,
    },
  ];

  function openOnDealPilot(merchant?: string) {
    if (!merchant) return;
    router.push(
      `/product/${encodeURIComponent(productId)}/buy?store=${encodeURIComponent(merchant)}`,
    );
  }

  if (!rows.length) {
    return (
      <p className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
        No merchant offers for this product right now.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="deal-grid overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <AgGridReact<Row>
          modules={gridModules}
          theme={dealGridTheme}
          rowData={rows}
          columnDefs={columnDefs}
          domLayout="autoHeight"
          headerHeight={42}
          rowHeight={52}
          suppressCellFocus
          defaultColDef={{
            sortable: true,
            filter: false,
            suppressHeaderMenuButton: true,
            resizable: false,
            suppressMovable: true,
          }}
          getRowStyle={(params) =>
            params.data?.lowest ? { backgroundColor: "#f0fdf4" } : undefined
          }
          rowStyle={{ cursor: "pointer" }}
          onRowClicked={(event) => openOnDealPilot(event.data?.merchant)}
        />
      </div>
      <p className="text-xs text-stone-500">
        Click a store to check out on Paywise. Prices are the item price only.
      </p>
    </div>
  );
}
