import { Request, Response } from "express";
import { findPrimaryBusinessByUserId } from "../models/business.model";
import {
  getExpenseBreakdown,
  getLowStockItems,
  getPaymentMix,
  getProductCounts,
  getSalesTrend,
  getTodaySalesSummary,
  getTopSales,
  getYesterdaySalesTotal,
  getWeeklyFinancials,
} from "../models/dashboard.model";
import { sendError, sendSuccess } from "../utils/response";

function formatPeso(value: number) {
  return `₱${Math.round(value).toLocaleString("en-PH")}`;
}

function formatPercentChange(today: number, yesterday: number) {
  if (yesterday <= 0) {
    return today > 0 ? "+100% from yesterday" : "No sales yesterday";
  }

  const change = ((today - yesterday) / yesterday) * 100;
  const prefix = change >= 0 ? "+" : "";

  return `${prefix}${change.toFixed(1)}% from yesterday`;
}

function formatHour(hour: number) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;

  return `${displayHour} ${period}`;
}

function getPaymentLabel(method: string) {
  if (method === "qrph") return "QR Ph";
  if (method === "gcash") return "GCash";

  return method.charAt(0).toUpperCase() + method.slice(1);
}

export async function getDashboardOverview(
  req: Request,
  res: Response
) {
  try {
    if (!req.user?.user_id) {
      return sendError(res, 401, "Authentication is required.");
    }

    const business = await findPrimaryBusinessByUserId(req.user.user_id);

    if (!business) {
      return sendError(res, 404, "No business workspace found.");
    }

    const [
      todaySummary,
      yesterdaySales,
      productCounts,
      lowStockItems,
      salesTrendRows,
      topSalesRows,
      paymentMixRows,
      expenseRows,
      weeklyFinancials,
    ] = await Promise.all([
      getTodaySalesSummary(business.id),
      getYesterdaySalesTotal(business.id),
      getProductCounts(business.id),
      getLowStockItems(business.id),
      getSalesTrend(business.id),
      getTopSales(business.id),
      getPaymentMix(business.id),
      getExpenseBreakdown(business.id),
      getWeeklyFinancials(business.id),
    ]);

    const totalSales = Number(todaySummary?.total_sales || 0);
    const transactions = Number(todaySummary?.transaction_count || 0);
    const averageBasket = Number(todaySummary?.average_basket || 0);
    const totalExpenses = expenseRows.reduce(
      (sum, expense) => sum + Number(expense.total_amount || 0),
      0
    );
    const netIncome = totalSales - totalExpenses;
    const paymentTotal = paymentMixRows.reduce(
      (sum, item) => sum + Number(item.total_sales || 0),
      0
    );
    const paymentMix = paymentMixRows
      .slice(0, 2)
      .map((item) => {
        const percent =
          paymentTotal > 0
            ? Math.round((Number(item.total_sales || 0) / paymentTotal) * 100)
            : 0;

        return `${percent}% ${getPaymentLabel(item.payment_method)}`;
      })
      .join(", ");
    const salesTrend = salesTrendRows.map((item) => ({
      label: formatHour(item.sale_hour),
      value: Number(item.total_sales || 0),
    }));
    const peakHour = salesTrendRows.reduce(
      (peak, item) =>
        Number(item.total_sales || 0) > Number(peak?.total_sales || 0)
          ? item
          : peak,
      salesTrendRows[0]
    );
    const maxExpense = Math.max(
      ...expenseRows.map((expense) => Number(expense.total_amount || 0)),
      1
    );
    const dateKey = (value: string | Date) =>
      new Date(value).toISOString().slice(0, 10);
    const weeklySales = new Map(
      weeklyFinancials.salesRows.map((row) => [
        dateKey(row.activity_date),
        Number(row.amount || 0),
      ])
    );
    const weeklyExpenses = new Map(
      weeklyFinancials.expenseRows.map((row) => [
        dateKey(row.activity_date),
        Number(row.amount || 0),
      ])
    );
    const weekly = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const income = weeklySales.get(key) || 0;
      const expenses = weeklyExpenses.get(key) || 0;
      return {
        date: key,
        label: date.toLocaleDateString("en-PH", { weekday: "short" }),
        income,
        expenses,
        net: income - expenses,
      };
    });

    return sendSuccess(res, 200, "Dashboard data loaded.", {
      business: {
        id: business.id,
        business_name: business.business_name,
      },
      metrics: {
        totalSales: {
          value: formatPeso(totalSales),
          detail: formatPercentChange(totalSales, yesterdaySales),
        },
        transactions: {
          value: transactions.toLocaleString("en-PH"),
          detail:
            peakHour && transactions > 0
              ? `Peak around ${formatHour(peakHour.sale_hour)}`
              : "No sales yet today",
        },
        activeProducts: {
          value: productCounts.activeProducts.toLocaleString("en-PH"),
          detail: "Products currently active",
        },
        lowStock: {
          value: productCounts.lowStockCount.toLocaleString("en-PH"),
          detail: "Needs attention today",
        },
      },
      lowStockItems: lowStockItems.map((item) => ({
        name: item.name,
        stock: item.current_stock,
        reorder: item.reorder_level,
      })),
      analyticsTools: [
        {
          label: "Peak selling hour",
          value: peakHour ? formatHour(peakHour.sale_hour) : "No sales yet",
          detail:
            peakHour && Number(peakHour.total_sales) > 0
              ? `${formatPeso(Number(peakHour.total_sales))} sales`
              : "Waiting for transactions",
        },
        {
          label: "Average basket",
          value: formatPeso(averageBasket),
          detail: `${transactions.toLocaleString("en-PH")} transactions`,
        },
        {
          label: "Payment mix",
          value: paymentMix || "No payments yet",
          detail: paymentMixRows.length
            ? `${paymentMixRows.length} payment methods`
            : "Waiting for payments",
        },
      ],
      salesTrend,
      topSales: topSalesRows.map((sale, index) => ({
        rank: String(index + 1).padStart(2, "0"),
        product: sale.product,
        category: sale.category || "Uncategorized",
        sold: `${Number(sale.sold || 0).toLocaleString("en-PH")} sold`,
        revenue: formatPeso(Number(sale.revenue || 0)),
        trend: index === 0 ? "Top item" : "Selling",
      })),
      income: {
        summary: {
          salesIncome: formatPeso(totalSales),
          storeExpenses: formatPeso(totalExpenses),
          netIncome: formatPeso(netIncome),
        },
        expenseBreakdown: expenseRows.map((expense) => ({
          label: expense.category,
          value: formatPeso(Number(expense.total_amount || 0)),
          width: `${Math.round((Number(expense.total_amount || 0) / maxExpense) * 100)}%`,
        })),
        weekly,
      },
    });
  } catch (error) {
    return sendError(res, 500, "Unable to load dashboard data.", error);
  }
}
