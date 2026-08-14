import {
  AlertTriangle,
  ArrowUpRight,
  Boxes,
  CreditCard,
  Receipt,
  Search,
  Store,
} from "lucide-react";
import { useEffect, useState } from "react";
import { STORAGE_KEYS } from "../../../constants/storage";
import api from "../../../services/api";
import { readJson } from "../../../utils/storage";
import OwnerSidebar from "../components/OwnerSidebar";
import { PageLoadingState } from "../../../components/LoadingSpinner";

type DashboardOverview = {
  metrics: {
    totalSales: { value: string; detail: string };
    transactions: { value: string; detail: string };
    activeProducts: { value: string; detail: string };
    lowStock: { value: string; detail: string };
  };
  lowStockItems: Array<{ name: string; stock: number; reorder: number }>;
  analyticsTools: Array<{ label: string; value: string; detail: string }>;
  salesTrend: Array<{ label: string; value: number }>;
  topSales: Array<{
    rank: string;
    product: string;
    category: string;
    sold: string;
    revenue: string;
    trend: string;
  }>;
};

const metrics = [
  {
    label: "Today’s sales",
    value: "₱12,450",
    detail: "+12.5% from yesterday",
    icon: CreditCard,
    tone: "leaf",
  },
  {
    label: "Transactions",
    value: "128",
    detail: "42 during peak hours",
    icon: Receipt,
    tone: "sage",
  },
  {
    label: "Active products",
    value: "342",
    detail: "18 added this week",
    icon: Boxes,
    tone: "leaf",
  },
  {
    label: "Low stock",
    value: "7",
    detail: "Needs attention today",
    icon: AlertTriangle,
    tone: "amber",
  },
];

const topSales = [
  {
    rank: "01",
    product: "Rice 5kg",
    category: "Staples",
    sold: "42 sold",
    revenue: "₱13,440",
    trend: "+18%",
  },
  {
    rank: "02",
    product: "Coke 1.5L",
    category: "Beverages",
    sold: "36 sold",
    revenue: "₱3,240",
    trend: "+9%",
  },
  {
    rank: "03",
    product: "Canned Sardines",
    category: "Canned Goods",
    sold: "28 sold",
    revenue: "₱1,540",
    trend: "+6%",
  },
  {
    rank: "04",
    product: "Instant Coffee",
    category: "Coffee",
    sold: "23 sold",
    revenue: "₱690",
    trend: "+4%",
  },
];

const lowStockItems = [
  { name: "Nescafe Stick", stock: 4, reorder: 24 },
  { name: "Coke 1.5L", stock: 6, reorder: 18 },
  { name: "Rice 5kg", stock: 3, reorder: 12 },
];

const analyticsTools = [
  {
    label: "Peak selling hour",
    value: "11 AM - 1 PM",
    detail: "42 transactions",
  },
  {
    label: "Average basket",
    value: "₱97.26",
    detail: "+8% this week",
  },
  {
    label: "Payment mix",
    value: "68% Cash",
    detail: "22% QR Ph, 10% GCash",
  },
];

const salesTrend = [
  { label: "8 AM", value: 3200 },
  { label: "10 AM", value: 5400 },
  { label: "12 PM", value: 12450 },
  { label: "2 PM", value: 9800 },
  { label: "4 PM", value: 14200 },
  { label: "6 PM", value: 16800 },
];

const salesTrendChart = {
  width: 720,
  height: 155,
  viewportHeight: 185,
};

function getToneClasses(tone: string) {
  if (tone === "amber") {
    return "bg-amber/10 text-amber";
  }

  if (tone === "sage") {
    return "bg-sage/10 text-sage";
  }

  return "bg-leaf/10 text-leaf-dark";
}

function buildLinePath(values: number[], width: number, height: number) {
  if (values.length === 0) return "";

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;
  const denominator = Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = (index / denominator) * width;
      const y = height - ((value - minValue) / range) * height;

      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function OwnerDashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const user = readJson<{ name?: string; email?: string }>(STORAGE_KEYS.user);
  const ownerName = user?.name || "Owner";
  const initial = ownerName.charAt(0).toUpperCase();
  const dashboardMetrics = overview
    ? [
        {
          ...metrics[0],
          value: overview.metrics.totalSales.value,
          detail: overview.metrics.totalSales.detail,
        },
        {
          ...metrics[1],
          value: overview.metrics.transactions.value,
          detail: overview.metrics.transactions.detail,
        },
        {
          ...metrics[2],
          value: overview.metrics.activeProducts.value,
          detail: overview.metrics.activeProducts.detail,
        },
        {
          ...metrics[3],
          value: overview.metrics.lowStock.value,
          detail: overview.metrics.lowStock.detail,
        },
      ]
    : metrics;
  const dashboardLowStockItems = overview
    ? overview.lowStockItems
    : lowStockItems;
  const dashboardAnalyticsTools = overview
    ? overview.analyticsTools
    : analyticsTools;
  const dashboardSalesTrend = overview ? overview.salesTrend : salesTrend;
  const dashboardTopSales = overview ? overview.topSales : topSales;
  const salesTrendPath = buildLinePath(
    dashboardSalesTrend.map((item) => item.value),
    salesTrendChart.width,
    salesTrendChart.height,
  );
  const salesTrendAreaPath = `${salesTrendPath} L ${salesTrendChart.width} ${salesTrendChart.height} L 0 ${salesTrendChart.height} Z`;
  const currentDateLabel = new Date().toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    async function loadDashboardOverview() {
      try {
        const response = await api.get("/dashboard/overview");
        setOverview(response.data.data);
      } catch {
        setOverview(null);
      } finally {
        setIsLoadingOverview(false);
      }
    }

    loadDashboardOverview();
  }, []);

  if (isLoadingOverview) {
    return <PageLoadingState fullScreen label="Loading dashboard data..." />;
  }

  return (
    <main className="h-dvh overflow-hidden bg-paper-dim font-sans text-ink">
      <div className="min-h-screen">
        <OwnerSidebar />

        <section className="h-dvh min-w-0 overflow-x-hidden overflow-y-auto lg:ml-72">
          <header className="dashboard-enter sticky top-0 z-30 border-b border-ink-line bg-paper-dim/90 py-3 pl-20 pr-4 backdrop-blur-xl sm:pr-6 lg:px-6 lg:py-4">
            <div className="flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink-soft sm:text-sm">
                  Owner Dashboard
                </p>
                <h1 className="truncate font-display text-lg font-bold text-pine sm:text-2xl">
                  Welcome back, {ownerName}
                </h1>
              </div>

              <div className="hidden h-11 items-center gap-2 rounded-xl border border-ink-line bg-white px-4 text-sm font-semibold text-ink-soft md:flex">
                <Search size={17} />
                <span>Search sales, products...</span>
              </div>

              <div className="hidden rounded-xl border border-amber/30 bg-amber/10 px-3 py-2 text-xs font-bold text-amber sm:block">
                {overview?.metrics.lowStock.value || "7"} low-stock items
              </div>

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-sm font-bold text-white sm:h-11 sm:w-11">
                {initial}
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[94rem] px-3 py-4 sm:px-6 sm:py-6 lg:py-8">
            <section className="dashboard-enter rounded-lg bg-white px-4 py-5 shadow-[0_18px_45px_rgba(15,111,87,0.07)] sm:px-8 sm:py-6 lg:px-10 lg:py-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-leaf/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-leaf-dark">
                    <Store size={14} />
                    Business overview
                  </div>
                  <h1 className="mt-2 font-display text-3xl font-bold text-pine sm:text-4xl">
                    Dashboard
                  </h1>
                  <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-ink-soft sm:text-base sm:leading-7">
                    Review top sales, analytics signals, and low stock items in
                    one clean view.
                  </p>
                </div>

                <p className="text-sm font-bold text-pine lg:mt-[3.25rem]">
                  Date {currentDateLabel}
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
                {dashboardMetrics.map(
                  ({ label, value, detail, icon: Icon, tone }, index) => (
                    <div
                      key={label}
                      className="dashboard-enter grid min-h-[6.35rem] grid-cols-[2.75rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-lg border border-ink-line bg-white px-4 py-3.5 transition hover:border-leaf/30 hover:shadow-[0_12px_26px_rgba(15,111,87,0.08)]"
                      style={{ animationDelay: `${120 + index * 55}ms` }}
                    >
                      <span
                        className={`flex h-11 w-11 items-center justify-center rounded-lg ${getToneClasses(tone)}`}
                      >
                        <Icon size={20} strokeWidth={2} />
                      </span>

                      <div className="min-w-0 self-center">
                        <p className="truncate text-[0.78rem] font-bold leading-4 text-ink-soft">
                          {label}
                        </p>
                        <p className="mt-0.5 truncate font-display text-[1.45rem] font-bold leading-7 text-pine">
                          {value}
                        </p>
                        <p
                          className={`mt-0.5 truncate text-[0.68rem] font-bold leading-4 ${
                            tone === "amber" ? "text-amber" : "text-sage"
                          }`}
                        >
                          {detail}
                        </p>
                      </div>

                      <ArrowUpRight
                        className="self-start text-ink-soft"
                        size={18}
                        strokeWidth={2}
                      />
                    </div>
                  ),
                )}
              </div>

              <div className="mt-6 rounded-lg border border-amber/20 bg-amber/5 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber/10 text-amber">
                    <AlertTriangle size={20} />
                  </span>
                  <div>
                    <h2 className="font-display text-xl font-bold text-pine">
                      Low stock alerts
                    </h2>
                    <p className="text-sm font-medium text-ink-soft">
                      Items that need restocking today.
                    </p>
                  </div>
                </div>

                {dashboardLowStockItems.length === 0 ? (
                  <div className="rounded-lg border border-leaf/15 bg-white px-4 py-5 text-sm font-bold text-leaf-dark">
                    All active products are above their reorder levels.
                  </div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-3">
                    {dashboardLowStockItems.map((item) => (
                      <div
                        key={item.name}
                        className="grid min-h-[6.35rem] grid-cols-[2.75rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-lg border border-amber/15 bg-white px-4 py-3.5 transition hover:border-amber/35 hover:shadow-[0_12px_26px_rgba(230,159,44,0.08)]"
                      >
                        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber/10 text-amber">
                          <Boxes size={20} strokeWidth={2} />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[0.78rem] font-bold leading-4 text-ink-soft">
                            {item.name}
                          </p>
                          <p className="mt-0.5 font-display text-[1.45rem] font-bold leading-7 text-pine">
                            {item.stock} left
                          </p>
                          <p className="mt-0.5 truncate text-[0.68rem] font-bold leading-4 text-amber">
                            Reorder at {item.reorder}
                          </p>
                        </div>
                        <ArrowUpRight
                          className="self-start text-ink-soft"
                          size={18}
                          strokeWidth={2}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8">
                <h2 className="font-display text-2xl font-bold text-pine">
                  Analytics tools
                </h2>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  Sales trend and key signals from today’s activity.
                </p>
              </div>

              <div className="mt-5 rounded-lg border border-ink-line bg-paper-dim px-5 py-5 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                      Sales trend
                    </p>
                    <p className="mt-1 font-display text-2xl font-bold text-pine">
                      {overview?.metrics.totalSales.value || "₱16,800"}
                    </p>
                  </div>
                  <p className="rounded-full bg-leaf/10 px-4 py-1 text-xs font-bold text-leaf-dark">
                    +22%
                  </p>
                </div>

                <svg
                  className="mt-5 h-44 w-full overflow-visible sm:h-[17.5rem]"
                  viewBox={`0 0 ${salesTrendChart.width} ${salesTrendChart.viewportHeight}`}
                  role="img"
                  aria-label="Sales trend line graph"
                >
                  <defs>
                    <linearGradient
                      id="salesTrendFill"
                      x1="0"
                      x2="0"
                      y1="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#2f9d63"
                        stopOpacity="0.28"
                      />
                      <stop offset="100%" stopColor="#2f9d63" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {[0, 1, 2].map((line) => (
                    <line
                      key={line}
                      className="dashboard-graph-grid"
                      x1="0"
                      x2={salesTrendChart.width}
                      y1={line * 55 + 28}
                      y2={line * 55 + 28}
                      stroke="#dbe7de"
                      strokeDasharray="5 8"
                    />
                  ))}
                  <path
                    className="dashboard-graph-area"
                    d={salesTrendAreaPath}
                    fill="url(#salesTrendFill)"
                  />
                  <path
                    className="dashboard-graph-line"
                    d={salesTrendPath}
                    fill="none"
                    pathLength={1}
                    stroke="#2f9d63"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="5"
                  />
                  {dashboardSalesTrend.map((point, index) => {
                    const maxValue = Math.max(
                      ...dashboardSalesTrend.map((item) => item.value),
                    );
                    const minValue = Math.min(
                      ...dashboardSalesTrend.map((item) => item.value),
                    );
                    const range = maxValue - minValue || 1;
                    const denominator = Math.max(
                      dashboardSalesTrend.length - 1,
                      1,
                    );
                    const x = (index / denominator) * salesTrendChart.width;
                    const y =
                      salesTrendChart.height -
                      ((point.value - minValue) / range) *
                        salesTrendChart.height;

                    return (
                      <g
                        key={point.label}
                        className="dashboard-graph-point"
                        style={{ animationDelay: `${620 + index * 70}ms` }}
                      >
                        <circle
                          cx={x}
                          cy={y}
                          fill="#f8faf7"
                          r="6"
                          stroke="#2f9d63"
                          strokeWidth="4"
                        />
                        <text
                          x={x}
                          y={salesTrendChart.viewportHeight - 2}
                          fill="#5b6961"
                          fontSize="10"
                          fontWeight="700"
                          textAnchor="middle"
                        >
                          {point.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-5 overflow-hidden rounded-lg border border-ink-line">
                <div className="divide-y divide-ink-line md:hidden">
                  {dashboardAnalyticsTools.map((tool) => (
                    <div key={tool.label} className="p-4">
                      <p className="text-xs font-bold text-ink-soft">
                        {tool.label}
                      </p>
                      <p className="mt-1 font-display text-lg font-bold text-pine">
                        {tool.value}
                      </p>
                      <p className="mt-1 text-xs font-bold text-sage">
                        {tool.detail}
                      </p>
                    </div>
                  ))}
                </div>
                <table className="hidden w-full min-w-170 text-left text-sm md:table">
                  <thead>
                    <tr className="bg-paper-dim/70 text-xs uppercase tracking-wide text-ink-soft">
                      <th className="px-4 py-3 font-bold">Tool</th>
                      <th className="px-4 py-3 font-bold">Value</th>
                      <th className="px-4 py-3 font-bold">Insight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardAnalyticsTools.map((tool) => (
                      <tr
                        key={tool.label}
                        className="dashboard-table-row border-b border-ink-line/70 last:border-0"
                      >
                        <td className="px-4 py-5 font-bold">{tool.label}</td>
                        <td className="px-4 py-5 font-display text-xl font-bold text-pine">
                          {tool.value}
                        </td>
                        <td className="px-4 py-5 text-sm font-bold text-sage">
                          {tool.detail}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              className="dashboard-enter mt-5 rounded-lg bg-white px-5 py-6 shadow-[0_18px_45px_rgba(15,111,87,0.07)] sm:px-8 lg:px-10"
              style={{ animationDelay: "360ms" }}
            >
              <div>
                <h2 className="font-display text-2xl font-bold text-pine">
                  Top sales
                </h2>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  Best-performing products based on today’s revenue.
                </p>
              </div>

              <div className="mt-4 overflow-hidden rounded-lg border border-ink-line">
                {dashboardTopSales.length === 0 && (
                  <p className="p-8 text-center text-sm font-bold text-ink-soft md:hidden">
                    Complete a POS sale to see top-selling products.
                  </p>
                )}
                <div className="divide-y divide-ink-line md:hidden">
                  {dashboardTopSales.map((sale) => (
                    <div key={sale.rank} className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-leaf/10 font-mono text-xs font-bold text-leaf-dark">
                          {sale.rank}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate font-bold text-ink">
                                {sale.product}
                              </p>
                              <p className="mt-1 text-xs font-bold text-sage">
                                {sale.trend} · {sale.category}
                              </p>
                            </div>
                            <p className="shrink-0 font-bold text-pine">
                              {sale.revenue}
                            </p>
                          </div>
                          <p className="mt-3 text-xs font-bold text-ink-soft">
                            {sale.sold}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <table className="hidden w-full min-w-180 text-left text-sm md:table">
                  <thead>
                    <tr className="bg-paper-dim/70 text-xs uppercase tracking-wide text-ink-soft">
                      <th className="px-4 py-3 font-bold">Rank</th>
                      <th className="px-4 py-3 font-bold">Product</th>
                      <th className="px-4 py-3 font-bold">Category</th>
                      <th className="px-4 py-3 font-bold">Sold</th>
                      <th className="px-4 py-3 text-right font-bold">
                        Revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardTopSales.length === 0 && (
                      <tr>
                        <td
                          className="px-4 py-8 text-center text-sm font-bold text-ink-soft"
                          colSpan={5}
                        >
                          Complete a POS sale to see top-selling products.
                        </td>
                      </tr>
                    )}
                    {dashboardTopSales.map((sale) => (
                      <tr
                        key={sale.rank}
                        className="dashboard-table-row border-b border-ink-line/70 last:border-0"
                      >
                        <td className="px-4 py-5">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-leaf/10 font-mono text-xs font-bold text-leaf-dark">
                            {sale.rank}
                          </span>
                        </td>
                        <td className="px-4 py-5">
                          <p className="font-bold">{sale.product}</p>
                          <p className="mt-1 text-xs font-bold text-sage">
                            {sale.trend}
                          </p>
                        </td>
                        <td className="px-4 py-5 text-ink-soft">
                          {sale.category}
                        </td>
                        <td className="px-4 py-5">
                          <span className="rounded-full bg-paper-dim px-3 py-1 text-xs font-bold text-sage-dark">
                            {sale.sold}
                          </span>
                        </td>
                        <td className="px-4 py-5 text-right font-bold">
                          {sale.revenue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

export default OwnerDashboardPage;
