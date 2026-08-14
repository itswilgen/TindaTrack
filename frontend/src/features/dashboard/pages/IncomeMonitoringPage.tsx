import {
  Calendar,
  Plus,
  PieChart,
  Receipt,
  Search,
  TrendingDown,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { STORAGE_KEYS } from "../../../constants/storage";
import api from "../../../services/api";
import { readJson } from "../../../utils/storage";
import OwnerSidebar from "../components/OwnerSidebar";
import CompactMetricCard from "../components/CompactMetricCard";
import { PageLoadingState } from "../../../components/LoadingSpinner";

type ApexChartInstance = {
  destroy: () => void;
  render: () => Promise<void> | void;
};

type ApexChartsConstructor = new (
  element: HTMLElement,
  options: Record<string, unknown>,
) => ApexChartInstance;

type DashboardOverview = {
  income: {
    summary: {
      salesIncome: string;
      storeExpenses: string;
      netIncome: string;
    };
    expenseBreakdown: Array<{ label: string; value: string; width: string }>;
    weekly: Array<{
      date: string;
      label: string;
      income: number;
      expenses: number;
      net: number;
    }>;
  };
};

declare global {
  interface Window {
    ApexCharts?: ApexChartsConstructor;
  }
}

const incomeSummary = [
  {
    label: "Sales Income",
    value: "₱12,450",
    detail: "Gross revenue collected today",
    change: "+12.5% vs yesterday",
    isPositive: true,
    icon: TrendingUp,
    tone: "income",
    width: "100%",
  },
  {
    label: "Store Expenses",
    value: "₱8,330",
    detail: "Inventory, staff, and utilities",
    change: "-3.2% vs yesterday",
    isPositive: true,
    icon: TrendingDown,
    tone: "expense",
    width: "67%",
  },
  {
    label: "Net Income",
    value: "₱4,120",
    detail: "Profit margin after operations",
    change: "+8.4% this week",
    isPositive: true,
    icon: Wallet,
    tone: "net",
    width: "33%",
  },
];

const incomeBars = [
  { label: "Mon", income: 9400, expenses: 6200, net: 3200 },
  { label: "Tue", income: 11200, expenses: 7400, net: 3800 },
  { label: "Wed", income: 8750, expenses: 6800, net: 1950 },
  { label: "Thu", income: 12450, expenses: 8330, net: 4120 },
  { label: "Fri", income: 10800, expenses: 7900, net: 2900 },
  { label: "Sat", income: 14200, expenses: 9100, net: 5100 },
  { label: "Sun", income: 7600, expenses: 5400, net: 2200 },
];

const expenseBreakdown = [
  { label: "Product Cost", value: "₱5,850", width: "70%", percentage: "70.2%" },
  {
    label: "Staff Allowance",
    value: "₱1,450",
    width: "17%",
    percentage: "17.4%",
  },
  {
    label: "Utilities & Fuel",
    value: "₱1,030",
    width: "12%",
    percentage: "12.4%",
  },
];

function IncomeBarChart({ bars }: { bars: typeof incomeBars }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isChartReady, setIsChartReady] = useState(true);

  useEffect(() => {
    if (!chartRef.current) return undefined;

    if (!window.ApexCharts) {
      setIsChartReady(false);
      return undefined;
    }

    const chart = new window.ApexCharts(chartRef.current, {
      chart: {
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 600,
        },
        fontFamily: "Inter, system-ui, sans-serif",
        height: 310,
        toolbar: { show: false },
        type: "bar",
        background: "transparent",
      },
      colors: ["#10b981", "#f43f5e", "#0284c7"],
      dataLabels: { enabled: false },
      fill: { opacity: 0.95 },
      grid: {
        borderColor: "#f1f5f9",
        strokeDashArray: 4,
        yaxis: { lines: { show: true } },
      },
      legend: {
        horizontalAlign: "left",
        labels: { colors: "#64748b" },
        markers: { radius: 6, width: 10, height: 10 },
        position: "top",
        fontSize: "13px",
        fontWeight: 600,
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          borderRadiusApplication: "end",
          columnWidth: "55%",
          horizontal: false,
        },
      },
      series: [
        {
          data: bars.map((item) => item.income),
          name: "Income",
        },
        {
          data: bars.map((item) => item.expenses),
          name: "Expenses",
        },
        {
          data: bars.map((item) => item.net),
          name: "Net Profit",
        },
      ],
      tooltip: {
        theme: "light",
        y: {
          formatter: (value: number) => `₱${value.toLocaleString("en-PH")}`,
        },
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        categories: bars.map((item) => item.label),
        labels: {
          style: {
            colors: "#64748b",
            fontWeight: 600,
            fontSize: "12px",
          },
        },
      },
      yaxis: {
        labels: {
          formatter: (value: number) => `₱${Math.round(value / 1000)}k`,
          style: { colors: "#94a3b8", fontSize: "12px" },
        },
      },
    });

    chart.render();
    setIsChartReady(true);

    return () => chart.destroy();
  }, [bars]);

  return (
    <div className="relative min-h-[310px] w-full">
      <div ref={chartRef} className="min-h-[310px]" />
      {!isChartReady && (
        <div className="flex min-h-[310px] items-center justify-center text-center text-sm font-semibold text-slate-400">
          Chart library is loading or offline...
        </div>
      )}
    </div>
  );
}

function IncomeMonitoringPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [expenses, setExpenses] = useState<
    Array<{
      id: number;
      category: string;
      amount: number;
      description: string | null;
      expense_date: string;
    }>
  >([]);
  const [search, setSearch] = useState("");
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: "",
    amount: "",
    description: "",
    expense_date: new Date().toISOString().slice(0, 10),
  });
  const [pageError, setPageError] = useState("");
  const [pageMessage, setPageMessage] = useState("");
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [isLoadingIncome, setIsLoadingIncome] = useState(true);
  const user = readJson<{ name?: string; email?: string }>(STORAGE_KEYS.user);
  const ownerName = user?.name || "Owner";
  const initial = ownerName.charAt(0).toUpperCase();
  const currentDateLabel = new Date().toLocaleDateString("en-PH", {
    dateStyle: "long",
  });

  const dashboardIncomeSummary = overview
    ? [
        {
          ...incomeSummary[0],
          value: overview.income.summary.salesIncome,
        },
        {
          ...incomeSummary[1],
          value: overview.income.summary.storeExpenses,
        },
        {
          ...incomeSummary[2],
          value: overview.income.summary.netIncome,
        },
      ]
    : incomeSummary;

  const dashboardExpenseBreakdown = overview?.income.expenseBreakdown?.length
    ? overview.income.expenseBreakdown
    : expenseBreakdown;

  async function loadIncomeData() {
    try {
      const [overviewResponse, expensesResponse] = await Promise.all([
        api.get("/dashboard/overview"),
        api.get("/operations/expenses"),
      ]);
      setOverview(overviewResponse.data.data);
      setExpenses(expensesResponse.data.data.expenses || []);
    } catch (error: any) {
      setPageError(
        error.response?.data?.message || "Unable to load income data.",
      );
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardOverview() {
      try {
        const [response, expensesResponse] = await Promise.all([
          api.get("/dashboard/overview"),
          api.get("/operations/expenses"),
        ]);

        if (isMounted) {
          setOverview(response.data.data);
          setExpenses(expensesResponse.data.data.expenses || []);
        }
      } catch {
        if (isMounted) {
          setOverview(null);
        }
      } finally {
        if (isMounted) setIsLoadingIncome(false);
      }
    }

    loadDashboardOverview();

    return () => {
      isMounted = false;
    };
  }, []);

  async function saveExpense(event: React.FormEvent) {
    event.preventDefault();
    try {
      setIsSavingExpense(true);
      setPageError("");
      await api.post("/operations/expenses", {
        ...expenseForm,
        amount: Number(expenseForm.amount),
      });
      setPageMessage("Expense recorded and income totals updated.");
      setExpenseForm({
        category: "",
        amount: "",
        description: "",
        expense_date: new Date().toISOString().slice(0, 10),
      });
      setIsExpenseOpen(false);
      await loadIncomeData();
    } catch (error: any) {
      setPageError(
        error.response?.data?.message || "Unable to record expense.",
      );
    } finally {
      setIsSavingExpense(false);
    }
  }

  const chartBars = overview?.income.weekly?.length
    ? overview.income.weekly
    : incomeBars;
  const filteredExpenses = expenses.filter((expense) =>
    `${expense.category} ${expense.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase().trim()),
  );

  if (isLoadingIncome) {
    return <PageLoadingState fullScreen label="Loading financial data..." />;
  }

  return (
    <main className="h-dvh overflow-hidden bg-slate-50 font-sans text-slate-800">
      <div className="flex h-full min-h-screen">
        <OwnerSidebar />

        <section className="h-dvh min-w-0 flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 lg:ml-72">
          {/* Header */}
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 py-3 pl-20 pr-4 backdrop-blur-md sm:pr-6 lg:px-6 lg:py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Financial Analytics
                </p>
                <h1 className="truncate text-lg font-bold text-slate-900 sm:text-2xl">
                  Income Monitoring
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative hidden w-64 md:block">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search logs & records..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 transition focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm sm:flex">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{currentDateLabel}</span>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-sm shadow-emerald-600/20">
                  {initial}
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <div className="mx-auto max-w-[90rem] space-y-5 px-3 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:py-8">
            {pageError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600">
                {pageError}
              </div>
            )}
            {pageMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {pageMessage}
              </div>
            )}
            {/* Top Overview Section */}
            <div className="space-y-6">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    <Receipt size={14} />
                    <span>Real-time Financial Overview</span>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    Profit & Loss Summary
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Track daily gross revenues, operational expenses, and net
                    profit margins.
                  </p>
                </div>

                <button
                  onClick={() => setIsExpenseOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto"
                >
                  <Plus size={14} />
                  <span>Add Expense</span>
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {dashboardIncomeSummary.map(
                  ({ label, value, change, icon: Icon, tone }) => (
                    <CompactMetricCard
                      key={label}
                      detail={change}
                      icon={Icon}
                      label={label}
                      tone={
                        tone === "expense"
                          ? "rose"
                          : tone === "net"
                            ? "sky"
                            : "leaf"
                      }
                      value={value}
                    />
                  ),
                )}
              </div>
            </div>

            {/* Charts & Visual Analytics Section */}
            <div className="space-y-4">
              {/* Main Chart */}
              <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Weekly Financial Flow
                    </h3>
                    <p className="text-xs font-medium text-slate-500">
                      Detailed comparison between sales income, costs, and net
                      results.
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <IncomeBarChart bars={chartBars} />
                </div>
              </div>

              {/* Income vs Expenses Progress */}
              <div className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid items-center gap-5 md:grid-cols-2 xl:grid-cols-[14rem_repeat(3,minmax(0,1fr))] xl:gap-7">
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                      <PieChart size={18} />
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Ratio Overview
                      </h3>
                      <p className="mt-0.5 text-xs font-medium text-slate-500">
                        Current session
                      </p>
                    </div>
                  </div>

                  {dashboardIncomeSummary.map((item) => {
                    const isExpense = item.tone === "expense";
                    const isNet = item.tone === "net";

                    return (
                      <div key={item.label} className="min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-3 text-xs font-semibold">
                          <span className="truncate text-slate-600">
                            {item.label}
                          </span>
                          <span className="shrink-0 font-bold text-slate-900">
                            {item.value}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isExpense
                                ? "bg-rose-500"
                                : isNet
                                  ? "bg-sky-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: item.width }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Expense Breakdown Section */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Expense Category Breakdown
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  Distribution of operational store costs for today.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {dashboardExpenseBreakdown.map((expense) => (
                  <div
                    key={expense.label}
                    className="rounded-xl border border-slate-200/80 bg-slate-50 p-4 transition hover:border-slate-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600">
                        {expense.label}
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {expense.value}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-amber-500"
                          style={{ width: expense.width }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {"percentage" in expense
                          ? (expense as { percentage?: string }).percentage
                          : expense.width}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm sm:rounded-2xl">
              <div className="border-b border-slate-200 p-4 sm:p-5">
                <h3 className="text-lg font-bold text-slate-900">
                  Recent expenses
                </h3>
                <p className="text-xs font-medium text-slate-500">
                  Search from the header or add a new store expense.
                </p>
                <label className="mt-4 flex h-11 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 md:hidden">
                  <Search size={16} />
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search expenses"
                    className="min-w-0 flex-1 bg-transparent text-slate-800 outline-none"
                  />
                </label>
              </div>
              {filteredExpenses.length === 0 && (
                <p className="p-6 text-center text-sm font-semibold text-slate-400">
                  No expenses found.
                </p>
              )}
              <div className="divide-y divide-slate-100 md:hidden">
                {filteredExpenses.map((expense) => (
                  <div key={expense.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800">
                          {expense.category}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {new Date(expense.expense_date).toLocaleDateString(
                            "en-PH",
                            { dateStyle: "medium" },
                          )}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold text-rose-600">
                        ₱
                        {Number(expense.amount).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    <p className="mt-3 truncate text-xs text-slate-500">
                      {expense.description || "No description"}
                    </p>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <div className="min-w-[680px]">
                  <div className="grid grid-cols-[9rem_11rem_minmax(0,1fr)_9rem] bg-slate-50 px-5 py-3 text-xs font-bold uppercase text-slate-500">
                    <span>Date</span>
                    <span>Category</span>
                    <span>Description</span>
                    <span className="text-right">Amount</span>
                  </div>
                  {filteredExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="grid grid-cols-[9rem_11rem_minmax(0,1fr)_9rem] border-t border-slate-100 px-5 py-3 text-sm"
                    >
                      <span className="font-semibold text-slate-500">
                        {new Date(expense.expense_date).toLocaleDateString(
                          "en-PH",
                        )}
                      </span>
                      <span className="font-bold text-slate-800">
                        {expense.category}
                      </span>
                      <span className="truncate text-slate-500">
                        {expense.description || "No description"}
                      </span>
                      <span className="text-right font-bold text-rose-600">
                        ₱
                        {Number(expense.amount).toLocaleString("en-PH", {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3 backdrop-blur-sm">
          <form
            onSubmit={saveExpense}
            className="max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-emerald-700">
                  Store expense
                </p>
                <h3 className="mt-1 text-2xl font-bold text-slate-900">
                  Record expense
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExpenseOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200"
              >
                <X size={17} />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold uppercase text-slate-500">
                Category
                <input
                  required
                  value={expenseForm.category}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      category: event.target.value,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold normal-case"
                  placeholder="Utilities, rent, supplies"
                />
              </label>
              <label className="text-xs font-bold uppercase text-slate-500">
                Amount
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={expenseForm.amount}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      amount: event.target.value,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold normal-case"
                />
              </label>
              <label className="text-xs font-bold uppercase text-slate-500">
                Expense date
                <input
                  required
                  type="date"
                  value={expenseForm.expense_date}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      expense_date: event.target.value,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold normal-case"
                />
              </label>
              <label className="text-xs font-bold uppercase text-slate-500 sm:col-span-2">
                Description
                <input
                  value={expenseForm.description}
                  onChange={(event) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: event.target.value,
                    })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold normal-case"
                  placeholder="Optional note"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsExpenseOpen(false)}
                className="h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold sm:w-auto"
              >
                Cancel
              </button>
              <button
                disabled={isSavingExpense}
                className="h-11 w-full rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white sm:w-auto"
              >
                {isSavingExpense ? "Saving..." : "Save expense"}
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

export default IncomeMonitoringPage;
