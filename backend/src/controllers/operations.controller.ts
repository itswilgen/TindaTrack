import { Request, Response } from "express";
import { findPrimaryBusinessByUserId } from "../models/business.model";
import {
  createExpense,
  createStaff,
  getExpenses,
  getInventoryOverview,
  getReportOverview,
  getSalesOverview,
  getSettings,
  getStaff,
  setStaffStatus,
  stockInProduct,
  updateStaffAccess,
  updateSettings,
} from "../models/operations.model";
import { sendError, sendSuccess } from "../utils/response";
import {
  INPUT_LIMITS,
  isValidEmail,
  isValidPassword,
  isWithinLength,
  normalizeEmail,
} from "../utils/validation";

async function getBusiness(req: Request) {
  if (!req.user?.user_id) return null;
  return findPrimaryBusinessByUserId(req.user.user_id);
}

function peso(value: unknown) {
  return `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function inventoryOverview(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const data = await getInventoryOverview(business.id, String(req.query.q || "").trim());
    return sendSuccess(res, 200, "Inventory loaded.", data);
  } catch (error) { return sendError(res, 500, "Unable to load inventory.", error); }
}

export async function stockIn(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const productId = Number(req.body.product_id);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) {
      return sendError(res, 400, "Select a product and enter a quantity greater than zero.");
    }
    const notes = String(req.body.notes || "").trim();
    if (!isWithinLength(notes, INPUT_LIMITS.notes)) {
      return sendError(res, 400, "Stock-in notes are too long.");
    }
    await stockInProduct({ businessId: business.id, productId, quantity, notes: notes || null });
    return sendSuccess(res, 201, "Stock-in recorded and product stock updated.");
  } catch (error: any) {
    if (error.message === "PRODUCT_NOT_FOUND") return sendError(res, 404, "Product not found or stock tracking is disabled.");
    return sendError(res, 500, "Unable to record stock-in.", error);
  }
}

export async function salesOverview(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const data = await getSalesOverview(business.id, String(req.query.q || "").trim());
    const gross = Number(data.summary?.gross_sales || 0);
    const paymentTotal = data.payments.reduce((sum, row) => sum + Number(row.amount || 0), 0);
    return sendSuccess(res, 200, "Sales loaded.", {
      summary: {
        gross_sales: peso(gross),
        transactions: Number(data.summary?.transactions || 0),
        average_basket: peso(data.summary?.average_basket),
        discounts: peso(data.summary?.discounts),
      },
      payments: data.payments.map((row) => ({
        method: row.payment_method,
        amount: Number(row.amount || 0),
        amount_label: peso(row.amount),
        percent: paymentTotal ? Math.round((Number(row.amount || 0) / paymentTotal) * 100) : 0,
      })),
      sales: data.sales.map((sale) => ({
        ...sale,
        item_count: Number(sale.item_count || 0),
        total_label: peso(sale.total_amount),
      })),
    });
  } catch (error) { return sendError(res, 500, "Unable to load sales.", error); }
}

export async function reportOverview(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const data = await getReportOverview(business.id);
    const total = Number(data.totals?.sales || 0);
    return sendSuccess(res, 200, "Reports loaded.", {
      totals: { sales: total, sales_label: peso(total), transactions: Number(data.totals?.transactions || 0), expenses: Number(data.expenses?.expenses || 0), net_income: total - Number(data.expenses?.expenses || 0) },
      categories: data.categories.map((row) => ({ category: row.category, sales: Number(row.sales || 0), sales_label: peso(row.sales), sold: Number(row.sold || 0), share: total ? Math.round((Number(row.sales || 0) / total) * 100) : 0 })),
    });
  } catch (error) { return sendError(res, 500, "Unable to load reports.", error); }
}

export async function exportReport(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const data = await getReportOverview(business.id);
    const lines = ["Category,Sales,Items Sold", ...data.categories.map((row) => `"${String(row.category).replace(/"/g, '""')}",${Number(row.sales || 0)},${Number(row.sold || 0)}`)];
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="tindatrack-report-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.status(200).send(`\uFEFF${lines.join("\n")}`);
  } catch (error) { return sendError(res, 500, "Unable to export report.", error); }
}

export async function staffOverview(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const staff = await getStaff(business.id);
    return sendSuccess(res, 200, "Staff loaded.", { staff });
  } catch (error) { return sendError(res, 500, "Unable to load staff.", error); }
}

export async function addStaff(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const role = String(req.body.role || "cashier") as "cashier" | "inventory_staff";
    if (
      !name ||
      !isWithinLength(name, 100) ||
      !isValidEmail(email) ||
      !isValidPassword(password) ||
      !["cashier", "inventory_staff"].includes(role)
    ) {
      return sendError(res, 400, "Enter a valid name, email, role, and password between 8 and 72 bytes.");
    }
    const id = await createStaff({ businessId: business.id, name, email, password, role });
    return sendSuccess(res, 201, "Staff account created.", { id });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") return sendError(res, 409, "An account with this email already exists.");
    return sendError(res, 500, "Unable to create staff account.", error);
  }
}

export async function updateStaffStatus(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const status = String(req.body.status) as "active" | "inactive";
    if (!["active", "inactive"].includes(status)) return sendError(res, 400, "Invalid staff status.");
    const updated = await setStaffStatus(business.id, Number(req.params.userId), status);
    if (!updated) return sendError(res, 404, "Staff member not found or owner status cannot be changed.");
    return sendSuccess(res, 200, "Staff status updated.");
  } catch (error) { return sendError(res, 500, "Unable to update staff status.", error); }
}

export async function updateStaffAccountAccess(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");

    const userId = Number(req.params.userId);
    const role = String(req.body.role || "") as "cashier" | "inventory_staff";
    const password = String(req.body.password || "");

    if (!Number.isInteger(userId) || userId <= 0) {
      return sendError(res, 400, "Invalid staff account.");
    }

    if (!["cashier", "inventory_staff"].includes(role)) {
      return sendError(res, 400, "Select a valid staff role.");
    }

    if (password && !isValidPassword(password)) {
      return sendError(res, 400, "The temporary password must be between 8 and 72 bytes.");
    }

    const updated = await updateStaffAccess({
      businessId: business.id,
      userId,
      role,
      password: password || undefined,
    });

    if (!updated) {
      return sendError(res, 404, "Staff member not found or owner access cannot be changed.");
    }

    return sendSuccess(
      res,
      200,
      password
        ? "Staff role and temporary password updated."
        : "Staff role updated."
    );
  } catch (error) {
    return sendError(res, 500, "Unable to update staff access.", error);
  }
}

export async function settingsOverview(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    return sendSuccess(res, 200, "Settings loaded.", await getSettings(business.id));
  } catch (error) { return sendError(res, 500, "Unable to load settings.", error); }
}

export async function saveSettings(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const businessName = String(req.body.business_name || "").trim();
    if (!businessName) return sendError(res, 400, "Store name is required.");
    await updateSettings({ businessId: business.id, businessName, businessType: String(req.body.business_type || "").trim() || null, phone: String(req.body.phone || "").trim() || null, address: String(req.body.address || "").trim() || null, notifications: req.body.notifications || {} });
    return sendSuccess(res, 200, "Settings saved.", await getSettings(business.id));
  } catch (error) { return sendError(res, 500, "Unable to save settings.", error); }
}

export async function expensesOverview(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    return sendSuccess(res, 200, "Expenses loaded.", { expenses: await getExpenses(business.id) });
  } catch (error) { return sendError(res, 500, "Unable to load expenses.", error); }
}

export async function addExpense(req: Request, res: Response) {
  try {
    const business = await getBusiness(req);
    if (!business) return sendError(res, 404, "No business workspace found.");
    const category = String(req.body.category || "").trim();
    const amount = Number(req.body.amount);
    const expenseDate = String(req.body.expense_date || new Date().toISOString().slice(0, 10));
    if (!category || !Number.isFinite(amount) || amount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(expenseDate)) return sendError(res, 400, "Enter a category, valid amount, and expense date.");
    const id = await createExpense({ businessId: business.id, category, amount, description: String(req.body.description || "").trim() || null, expenseDate });
    return sendSuccess(res, 201, "Expense recorded.", { id });
  } catch (error) { return sendError(res, 500, "Unable to record expense.", error); }
}
