import { Request, Response } from "express";
import db from "../config/db";
import { findPrimaryBusinessByUserId } from "../models/business.model";
import {
  createSaleItem,
  createSaleRecord,
  deductProductStock,
  findProductsForUpdate,
  getOrCreateMainRegister,
  getOrCreateOpenSession,
  getPosProducts,
} from "../models/pos.model";
import { sendError, sendSuccess } from "../utils/response";
import { INPUT_LIMITS, isWithinLength } from "../utils/validation";

const supportedPaymentMethods = new Set(["cash", "qrph", "gcash", "card"]);

function formatPeso(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function getUnitMultiplier(unitLabel: string) {
  const normalized = unitLabel.toLowerCase().trim();

  if (normalized === "1 kilo") return 1;
  if (normalized === "5 kilo") return 5;
  if (normalized === "10 kilo") return 10;

  return 1;
}

function createReceiptNumber() {
  return `POS-${new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "")}-${Date.now().toString().slice(-6)}`;
}

export async function getPosCatalog(req: Request, res: Response) {
  try {
    if (!req.user?.user_id) {
      return sendError(res, 401, "Authentication is required.");
    }

    const business = await findPrimaryBusinessByUserId(req.user.user_id);

    if (!business) {
      return sendError(res, 404, "No business workspace found.");
    }

    const products = await getPosProducts(business.id);
    const categories = Array.from(
      new Set(products.map((product) => product.category || "Uncategorized"))
    ).sort();

    return sendSuccess(res, 200, "POS catalog loaded.", {
      business: {
        id: business.id,
        business_name: business.business_name,
      },
      categories,
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        category: product.category || "Uncategorized",
        sku: product.sku,
        barcode: product.barcode,
        image_url: product.image_url,
        unit_label: product.unit_label || "Piece",
        price: formatPeso(Number(product.unit_price || 0)),
        unit_price: Number(product.unit_price || 0),
        cost_price: Number(product.cost_price || 0),
        current_stock: Number(product.current_stock || 0),
        reorder_level: Number(product.reorder_level || 0),
        stock_label:
          Number(product.current_stock || 0) <= Number(product.reorder_level || 0)
            ? `Low Stock (${Number(product.current_stock || 0)})`
            : `In Stock (${Number(product.current_stock || 0)})`,
      })),
    });
  } catch (error) {
    return sendError(res, 500, "Unable to load POS catalog.", error);
  }
}

export async function createPosSale(req: Request, res: Response) {
  let connection: Awaited<ReturnType<typeof db.getConnection>> | null = null;

  try {
    if (!req.user?.user_id) {
      return sendError(res, 401, "Authentication is required.");
    }

    const {
      items,
      payment_method: requestedPaymentMethod = "cash",
      discount = 0,
      cash_received,
      customer_name,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
      return sendError(res, 400, "Please add at least one cart item.");
    }

    const payment_method = String(requestedPaymentMethod).trim().toLowerCase();
    if (!supportedPaymentMethods.has(payment_method)) {
      return sendError(res, 400, "Unsupported payment method.");
    }

    const business = await findPrimaryBusinessByUserId(req.user.user_id);

    if (!business) {
      return sendError(res, 404, "No business workspace found.");
    }

    const parsedItems = items.map((item: Record<string, unknown>) => ({
      productId: Number(item.product_id),
      quantity: Number(item.quantity),
      unitLabel: String(item.unit_label || "Piece").trim(),
    }));

    if (
      parsedItems.some(
        (item) =>
          !Number.isFinite(item.productId) ||
          !Number.isInteger(item.productId) ||
          !Number.isFinite(item.quantity) ||
          item.productId <= 0 ||
          item.quantity <= 0 ||
          item.quantity > 1_000_000 ||
          !isWithinLength(item.unitLabel, INPUT_LIMITS.unit)
      )
    ) {
      return sendError(res, 400, "Cart items must include valid products and quantities.");
    }

    if (new Set(parsedItems.map((item) => item.productId)).size !== parsedItems.length) {
      return sendError(res, 400, "Each product must appear only once in the cart.");
    }

    const numericDiscount = Number(discount || 0);
    const numericCashReceived =
      cash_received === undefined || cash_received === null || cash_received === ""
        ? null
        : Number(cash_received);
    const customerName = String(customer_name || "Walk-in Customer").trim();

    if (!Number.isFinite(numericDiscount) || numericDiscount < 0) {
      return sendError(res, 400, "Discount must be a valid non-negative amount.");
    }
    if (
      (numericCashReceived !== null && (!Number.isFinite(numericCashReceived) || numericCashReceived < 0)) ||
      !isWithinLength(customerName, 120)
    ) {
      return sendError(res, 400, "Cash received or customer name is invalid.");
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const register = await getOrCreateMainRegister(connection, business.id);
    const session = await getOrCreateOpenSession(connection, {
      businessId: business.id,
      registerId: register.id,
      userId: req.user.user_id,
    });
    const products = await findProductsForUpdate(
      connection,
      business.id,
      parsedItems.map((item) => item.productId)
    );
    const productById = new Map(products.map((product) => [product.id, product]));

    if (products.length !== parsedItems.length) {
      await connection.rollback();
      return sendError(res, 400, "One or more products are unavailable.");
    }

    const saleLines = parsedItems.map((item) => {
      const product = productById.get(item.productId)!;
      const unitMultiplier = getUnitMultiplier(item.unitLabel);
      const baseQuantity = item.quantity * unitMultiplier;
      const unitPrice = Number(product.unit_price || 0) * unitMultiplier;
      const unitCost = Number(product.cost_price || 0) * unitMultiplier;
      const lineTotal = unitPrice * item.quantity;

      if (Number(product.current_stock || 0) < baseQuantity) {
        throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
      }

      return {
        product,
        quantity: item.quantity,
        unitLabel: item.unitLabel,
        unitMultiplier,
        baseQuantity,
        unitPrice,
        unitCost,
        lineTotal,
      };
    });
    const subtotal = saleLines.reduce((sum, item) => sum + item.lineTotal, 0);
    if (numericDiscount > subtotal) {
      await connection.rollback();
      return sendError(res, 400, "Discount cannot exceed the sale subtotal.");
    }
    const totalAmount = subtotal - numericDiscount;
    if (payment_method === "cash" && (numericCashReceived === null || numericCashReceived < totalAmount)) {
      await connection.rollback();
      return sendError(res, 400, "Cash received must cover the total amount.");
    }
    const changeDue =
      payment_method === "cash" && numericCashReceived !== null
        ? Math.max(numericCashReceived - totalAmount, 0)
        : null;
    const receiptNumber = createReceiptNumber();
    const saleId = await createSaleRecord(connection, {
      businessId: business.id,
      posSessionId: session.id,
      registerId: register.id,
      cashierUserId: req.user.user_id,
      receiptNumber,
      customerName: customerName || "Walk-in Customer",
      paymentMethod: payment_method,
      subtotal,
      discount: numericDiscount,
      totalAmount,
      cashReceived: numericCashReceived,
      changeDue,
    });

    for (const line of saleLines) {
      await createSaleItem(connection, {
        saleId,
        productId: line.product.id,
        quantity: line.quantity,
        unitLabel: line.unitLabel,
        unitMultiplier: line.unitMultiplier,
        baseQuantity: line.baseQuantity,
        unitPrice: line.unitPrice,
        unitCost: line.unitCost,
        lineTotal: line.lineTotal,
      });
      await deductProductStock(connection, {
        businessId: business.id,
        productId: line.product.id,
        baseQuantity: line.baseQuantity,
        saleId,
      });
    }

    await connection.commit();

    return sendSuccess(res, 201, "POS sale recorded.", {
      sale_id: saleId,
      receipt_number: receiptNumber,
      subtotal,
      discount: numericDiscount,
      total_amount: totalAmount,
      cash_received: numericCashReceived,
      change_due: changeDue,
      items: saleLines.map((line) => ({
        product_id: line.product.id,
        name: line.product.name,
        quantity: line.quantity,
        unit_label: line.unitLabel,
        base_quantity: line.baseQuantity,
        line_total: line.lineTotal,
      })),
    });
  } catch (error: any) {
    if (connection) await connection.rollback();

    if (String(error.message || "").startsWith("INSUFFICIENT_STOCK:")) {
      return sendError(
        res,
        409,
        `${String(error.message).replace("INSUFFICIENT_STOCK:", "")} does not have enough stock.`
      );
    }

    return sendError(res, 500, "Unable to record POS sale.", error);
  } finally {
    connection?.release();
  }
}
