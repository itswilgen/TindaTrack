import {
  Banknote,
  CreditCard,
  Download,
  Receipt,
  Search,
  Tag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../../services/api";
import OwnerPageShell from "../components/OwnerPageShell";
import CompactMetricCard from "../components/CompactMetricCard";
import { PageLoadingState } from "../../../components/LoadingSpinner";

type Sale = {
  id: number;
  receipt_number: string;
  customer_name: string | null;
  payment_method: string;
  payment_status: string;
  total_label: string;
  subtotal: number;
  discount: number;
  item_count: number;
  sold_at: string;
};
type SalesData = {
  summary: {
    gross_sales: string;
    transactions: number;
    average_basket: string;
    discounts: string;
  };
  sales: Sale[];
};
function paymentLabel(value: string) {
  return value === "gcash"
    ? "GCash"
    : value === "qrph"
      ? "QR Ph"
      : value.charAt(0).toUpperCase() + value.slice(1);
}

function SalesPage() {
  const [data, setData] = useState<SalesData | null>(null);
  const [search, setSearch] = useState("");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [error, setError] = useState("");
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  useEffect(() => {
    api
      .get("/operations/sales")
      .then((response) => setData(response.data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message || "Unable to load sales.",
        ),
      )
      .finally(() => setIsLoadingSales(false));
  }, []);
  const sales = useMemo(() => {
    const term = search.toLowerCase().trim();
    return term
      ? (data?.sales || []).filter((sale) =>
          `${sale.receipt_number} ${sale.customer_name} ${sale.payment_method}`
            .toLowerCase()
            .includes(term),
        )
      : data?.sales || [];
  }, [data, search]);
  function exportSales() {
    const rows = [
      ["Receipt", "Date", "Customer", "Items", "Payment", "Total", "Status"],
      ...sales.map((sale) => [
        sale.receipt_number,
        new Date(sale.sold_at).toLocaleString("en-PH"),
        sale.customer_name || "Walk-in Customer",
        String(sale.item_count),
        paymentLabel(sale.payment_method),
        sale.total_label,
        sale.payment_status,
      ]),
    ];
    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `tindatrack-sales-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const stats = [
    {
      label: "Gross sales",
      value: data?.summary.gross_sales || "₱0.00",
      detail: "Today",
      icon: Banknote,
      tone: "leaf" as const,
    },
    {
      label: "Transactions",
      value: String(data?.summary.transactions || 0),
      detail: "Completed sales",
      icon: Receipt,
      tone: "sage" as const,
    },
    {
      label: "Average basket",
      value: data?.summary.average_basket || "₱0.00",
      detail: "Per transaction",
      icon: CreditCard,
      tone: "leaf" as const,
    },
    {
      label: "Discounts",
      value: data?.summary.discounts || "₱0.00",
      detail: "Applied today",
      icon: Tag,
      tone: "amber" as const,
    },
  ];
  if (isLoadingSales) {
    return <PageLoadingState fullScreen label="Loading sales data..." />;
  }
  return (
    <OwnerPageShell
      badge={
        <>
          <Receipt size={14} />
          Transaction history
        </>
      }
      description="Review completed sales, discounts, and receipts from POS checkout."
      title="Sales"
      topLabel="Operations"
    >
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <CompactMetricCard
            key={stat.label}
            detail={stat.detail}
            icon={stat.icon}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-ink-line bg-white sm:rounded-2xl">
        <div className="border-b border-ink-line p-3 sm:p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_9rem]">
            <label className="flex h-11 min-w-0 items-center gap-3 rounded-xl border border-ink-line px-3 text-sm font-semibold text-ink-soft sm:px-4">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 w-full bg-transparent outline-none"
                placeholder="Search receipt, customer, payment"
                type="search"
              />
            </label>
            <button
              onClick={exportSales}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-ink-line bg-white px-4 text-sm font-black text-ink"
            >
              <Download size={17} />
              Export
            </button>
          </div>
        </div>
        <div className="divide-y divide-ink-line md:hidden">
          {sales.length === 0 && (
            <p className="p-8 text-center text-sm font-bold text-ink-soft">
              No sales found.
            </p>
          )}
          {sales.map((sale) => (
            <button
              onClick={() => setSelectedSale(sale)}
              key={sale.id}
              className="w-full p-4 text-left transition hover:bg-paper"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs font-black text-pine">
                    {sale.receipt_number}
                  </p>
                  <p className="mt-1 text-xs font-bold text-ink-soft">
                    {new Date(sale.sold_at).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-leaf/10 px-2.5 py-1 text-[0.68rem] font-black capitalize text-leaf-dark">
                  {sale.payment_status}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-ink">
                    {sale.customer_name || "Walk-in Customer"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-ink-soft">
                    {sale.item_count} items ·{" "}
                    {paymentLabel(sale.payment_method)}
                  </p>
                </div>
                <p className="shrink-0 font-black text-pine">
                  {sale.total_label}
                </p>
              </div>
            </button>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <div className="min-w-[820px]">
            <div className="grid grid-cols-[9rem_10rem_minmax(0,1fr)_6rem_8rem_8rem_6rem] bg-paper-dim/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-ink-soft">
              <span>Receipt</span>
              <span>Date</span>
              <span>Customer</span>
              <span>Items</span>
              <span>Payment</span>
              <span>Total</span>
              <span>Status</span>
            </div>
            {sales.length === 0 && (
              <p className="p-8 text-center text-sm font-bold text-ink-soft">
                No sales found.
              </p>
            )}
            {sales.map((sale) => (
              <button
                onClick={() => setSelectedSale(sale)}
                key={sale.id}
                className="grid w-full grid-cols-[9rem_10rem_minmax(0,1fr)_6rem_8rem_8rem_6rem] items-center border-t border-ink-line px-4 py-3 text-left text-sm transition hover:bg-paper"
              >
                <span className="font-mono text-xs font-black text-pine">
                  {sale.receipt_number}
                </span>
                <span className="text-xs font-bold text-ink-soft">
                  {new Date(sale.sold_at).toLocaleString("en-PH", {
                    dateStyle: "short",
                    timeStyle: "short",
                  })}
                </span>
                <span className="font-black text-ink">
                  {sale.customer_name || "Walk-in Customer"}
                </span>
                <span className="font-bold text-ink-soft">
                  {sale.item_count}
                </span>
                <span className="font-black text-ink">
                  {paymentLabel(sale.payment_method)}
                </span>
                <span className="font-black text-pine">{sale.total_label}</span>
                <span className="w-fit rounded-full bg-leaf/10 px-3 py-1 text-xs font-black capitalize text-leaf-dark">
                  {sale.payment_status}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine/45 p-3 backdrop-blur-sm">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-leaf-dark">
                  Receipt preview
                </p>
                <h3 className="mt-1 truncate font-display text-xl font-bold text-pine sm:text-2xl">
                  {selectedSale.receipt_number}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-line"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div className="flex flex-col gap-1 min-[390px]:flex-row min-[390px]:justify-between">
                <span className="text-ink-soft">Sold at</span>
                <span className="font-black">
                  {new Date(selectedSale.sold_at).toLocaleString("en-PH")}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-soft">Customer</span>
                <span className="text-right font-black">
                  {selectedSale.customer_name || "Walk-in Customer"}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-soft">Payment</span>
                <span className="font-black">
                  {paymentLabel(selectedSale.payment_method)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-soft">Items</span>
                <span className="font-black">{selectedSale.item_count}</span>
              </div>
              <div className="flex justify-between border-t border-ink-line pt-3 text-lg">
                <span className="font-black">Total</span>
                <span className="font-black text-leaf-dark">
                  {selectedSale.total_label}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </OwnerPageShell>
  );
}
export default SalesPage;
