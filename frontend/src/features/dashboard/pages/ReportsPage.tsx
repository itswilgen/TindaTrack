import {
  BarChart3,
  Boxes,
  CalendarDays,
  Download,
  Package,
  Receipt,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../../services/api";
import OwnerPageShell from "../components/OwnerPageShell";
import CompactMetricCard from "../components/CompactMetricCard";
import { PageLoadingState } from "../../../components/LoadingSpinner";

type ReportData = {
  totals: {
    sales_label: string;
    transactions: number;
    expenses: number;
    net_income: number;
  };
  categories: Array<{
    category: string;
    sales_label: string;
    sold: number;
    share: number;
  }>;
};
const reportCards = [
  {
    title: "Sales summary",
    detail: "Revenue and transaction count.",
    icon: Receipt,
  },
  {
    title: "Product performance",
    detail: "Category sales and item quantities.",
    icon: Package,
  },
  {
    title: "Inventory movement",
    detail: "Use Inventory for detailed movements.",
    icon: Boxes,
  },
  {
    title: "Income statement",
    detail: "Sales, expenses, and net income.",
    icon: Wallet,
  },
];
function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  useEffect(() => {
    api
      .get("/operations/reports")
      .then((response) => setData(response.data.data))
      .catch((requestError) =>
        setError(
          requestError.response?.data?.message || "Unable to load reports.",
        ),
      )
      .finally(() => setIsLoadingReports(false));
  }, []);
  async function downloadReport() {
    try {
      const response = await api.get("/operations/reports/export", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `tindatrack-report-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("Report downloaded.");
    } catch {
      setError("Unable to download report.");
    }
  }
  if (isLoadingReports) {
    return <PageLoadingState fullScreen label="Loading report data..." />;
  }
  return (
    <OwnerPageShell
      badge={
        <>
          <BarChart3 size={14} />
          Business reports
        </>
      }
      description="Review useful reports generated from actual sales, products, inventory, and expenses."
      title="Reports"
      topLabel="Analytics"
    >
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-5 rounded-xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf-dark">
          {message}
        </div>
      )}
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-ink-line bg-paper p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-leaf/10 text-leaf-dark">
            <CalendarDays size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-ink">All recorded data</p>
            <p className="text-xs font-bold text-ink-soft">
              Updated{" "}
              {new Date().toLocaleDateString("en-PH", { dateStyle: "long" })}
            </p>
          </div>
        </div>
        <button
          onClick={downloadReport}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-leaf px-4 text-sm font-black text-white sm:w-fit"
        >
          <Download size={17} />
          Download CSV
        </button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {reportCards.map(({ title, detail, icon: Icon }) => (
          <button
            key={title}
            onClick={() =>
              setMessage(`${title} is included in the live report below.`)
            }
            className="w-full text-left"
          >
            <CompactMetricCard
              detail={detail}
              icon={Icon}
              label={title}
              tone="leaf"
              value="Live report"
            />
          </button>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <CompactMetricCard
          detail="All completed sales"
          icon={Receipt}
          label="All-time sales"
          tone="leaf"
          value={data?.totals.sales_label || "₱0.00"}
        />
        <CompactMetricCard
          detail="Recorded POS checkouts"
          icon={BarChart3}
          label="Transactions"
          tone="sage"
          value={String(data?.totals.transactions || 0)}
        />
        <CompactMetricCard
          detail="Sales minus expenses"
          icon={Wallet}
          label="Net income"
          tone={(data?.totals.net_income || 0) >= 0 ? "leaf" : "rose"}
          value={`₱${(data?.totals.net_income || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
        />
      </div>
      <div className="mt-5 overflow-hidden rounded-xl border border-ink-line bg-white sm:rounded-2xl">
        <div className="border-b border-ink-line p-4">
          <h3 className="font-display text-lg font-bold text-pine sm:text-xl">
            Sales by category
          </h3>
          <p className="mt-1 text-sm font-medium text-ink-soft">
            Calculated from completed POS sales.
          </p>
        </div>
        {(data?.categories || []).length === 0 && (
          <p className="p-8 text-center text-sm font-bold text-ink-soft">
            Complete a POS sale to generate report data.
          </p>
        )}
        <div className="divide-y divide-ink-line md:hidden">
          {(data?.categories || []).map((row) => (
            <div key={row.category} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-black text-ink">{row.category}</p>
                <p className="shrink-0 font-black text-pine">
                  {row.sales_label}
                </p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs font-bold text-ink-soft">
                <span>{row.sold} items sold</span>
                <span className="rounded-full bg-leaf/10 px-2.5 py-1 font-black text-leaf-dark">
                  {row.share}% share
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[minmax(0,1fr)_9rem_9rem_7rem] bg-paper-dim/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-ink-soft">
              <span>Category</span>
              <span>Sales</span>
              <span>Sold</span>
              <span>Share</span>
            </div>
            {(data?.categories || []).map((row) => (
              <div
                key={row.category}
                className="grid grid-cols-[minmax(0,1fr)_9rem_9rem_7rem] items-center border-t border-ink-line px-4 py-4 text-sm"
              >
                <span className="font-black text-ink">{row.category}</span>
                <span className="font-black text-pine">{row.sales_label}</span>
                <span className="font-bold text-ink-soft">
                  {row.sold} items
                </span>
                <span className="font-black text-leaf-dark">{row.share}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </OwnerPageShell>
  );
}
export default ReportsPage;
