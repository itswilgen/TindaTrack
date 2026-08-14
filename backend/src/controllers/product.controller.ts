import { Request, Response } from "express";
import { findPrimaryBusinessByUserId } from "../models/business.model";
import {
  createProduct,
  deleteProduct,
  findProductByBarcode,
  findProductById,
  getProductsByBusinessId,
  ProductRow,
  ProductStatus,
  updateProduct,
} from "../models/product.model";
import { sendError, sendSuccess } from "../utils/response";
import {
  INPUT_LIMITS,
  isValidBarcode,
  isValidProductImage,
  isWithinLength,
  normalizeBarcode,
} from "../utils/validation";

const allowedStatuses = new Set<ProductStatus>(["active", "inactive"]);

function formatPeso(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function toNumber(value: unknown, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toProductPayload(product: ProductRow) {
  const stock = Number(product.current_stock || 0);
  const reorderLevel = Number(product.reorder_level || 0);
  const unitPrice = Number(product.unit_price || 0);
  const costPrice = Number(product.cost_price || 0);
  const margin =
    unitPrice > 0 ? Math.round(((unitPrice - costPrice) / unitPrice) * 100) : 0;

  return {
    id: product.id,
    name: product.name,
    category: product.category || "Uncategorized",
    sku: product.sku,
    barcode: product.barcode,
    image_url: product.image_url,
    unit_label: product.unit_label || "Piece",
    supplier: product.supplier,
    unit_price: unitPrice,
    cost_price: costPrice,
    current_stock: stock,
    reorder_level: reorderLevel,
    track_stock: Boolean(product.track_stock),
    show_in_pos: Boolean(product.show_in_pos),
    status: product.status,
    price_label: formatPeso(unitPrice),
    cost_label: formatPeso(costPrice),
    stock_label:
      stock <= reorderLevel ? `Low Stock (${stock})` : `In Stock (${stock})`,
    margin_label: `${margin}%`,
    updated_at: product.updated_at,
  };
}

export async function getProducts(req: Request, res: Response) {
  try {
    if (!req.user?.user_id) {
      return sendError(res, 401, "Authentication is required.");
    }

    const business = await findPrimaryBusinessByUserId(req.user.user_id);

    if (!business) {
      return sendError(res, 404, "No business workspace found.");
    }

    const products = await getProductsByBusinessId(business.id);
    const categories = Array.from(
      new Set(products.map((product) => product.category || "Uncategorized"))
    ).sort();
    const totalInventoryUnits = products.reduce(
      (sum, product) => sum + Number(product.current_stock || 0),
      0
    );
    const lowStockProducts = products.filter(
      (product) =>
        Number(product.current_stock || 0) <= Number(product.reorder_level || 0)
    );

    return sendSuccess(res, 200, "Products loaded.", {
      business: {
        id: business.id,
        business_name: business.business_name,
      },
      categories,
      stats: {
        total_products: products.length,
        low_stock: lowStockProducts.length,
        inventory_units: totalInventoryUnits,
        categories: categories.length,
      },
      products: products.map(toProductPayload),
    });
  } catch (error) {
    return sendError(res, 500, "Unable to load products.", error);
  }
}

export async function createProductRecord(req: Request, res: Response) {
  try {
    if (!req.user?.user_id) {
      return sendError(res, 401, "Authentication is required.");
    }

    const business = await findPrimaryBusinessByUserId(req.user.user_id);

    if (!business) {
      return sendError(res, 404, "No business workspace found.");
    }

    const input = parseProductInput(req.body);

    if (input.barcode && (await findProductByBarcode(business.id, input.barcode))) {
      return sendError(
        res,
        409,
        "This barcode is already assigned to another product."
      );
    }

    const productId = await createProduct({
      businessId: business.id,
      ...input,
    });
    const product = await findProductById(business.id, productId);

    return sendSuccess(
      res,
      201,
      "Product added successfully.",
      product ? toProductPayload(product) : { id: productId }
    );
  } catch (error: any) {
    if (String(error.message || "").startsWith("VALIDATION:")) {
      return sendError(res, 400, String(error.message).replace("VALIDATION:", ""));
    }
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 409, "Product SKU already exists in this store.");
    }

    return sendError(res, 500, "Unable to add product.", error);
  }
}

function parseProductInput(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const status = String(body.status || "active").toLowerCase() as ProductStatus;
  const unitPrice = toNumber(body.unit_price);
  const costPrice = toNumber(body.cost_price);
  const currentStock = toNumber(body.current_stock);
  const reorderLevel = toNumber(body.reorder_level);
  const barcode = normalizeBarcode(body.barcode);
  const category = String(body.category || "").trim();
  const sku = String(body.sku || "").trim();
  const imageUrl = String(body.image_url || "").trim();
  const unitLabel = String(body.unit_label || "Piece").trim() || "Piece";
  const supplier = String(body.supplier || "").trim();

  if (!name) throw new Error("VALIDATION:Product name is required.");
  if (!isWithinLength(name, INPUT_LIMITS.name)) {
    throw new Error("VALIDATION:Product name is too long.");
  }
  if (!isWithinLength(category, 100)) {
    throw new Error("VALIDATION:Category is too long.");
  }
  if (!isWithinLength(sku, INPUT_LIMITS.sku)) {
    throw new Error("VALIDATION:SKU is too long.");
  }
  if (!isWithinLength(unitLabel, INPUT_LIMITS.unit)) {
    throw new Error("VALIDATION:Unit is too long.");
  }
  if (!isWithinLength(supplier, INPUT_LIMITS.supplier)) {
    throw new Error("VALIDATION:Supplier is too long.");
  }
  if (!allowedStatuses.has(status)) {
    throw new Error("VALIDATION:Product status is invalid.");
  }
  if (unitPrice < 0 || costPrice < 0 || currentStock < 0 || reorderLevel < 0) {
    throw new Error("VALIDATION:Prices and stock values cannot be negative.");
  }
  if (unitPrice > 9_999_999_999.99 || costPrice > 9_999_999_999.99) {
    throw new Error("VALIDATION:Product price is too large.");
  }
  if (currentStock > 99_999_999.99 || reorderLevel > 99_999_999.99) {
    throw new Error("VALIDATION:Stock value is too large.");
  }
  if (!isValidBarcode(barcode)) {
    throw new Error("VALIDATION:Barcode contains unsupported characters.");
  }
  if (!isValidProductImage(imageUrl)) {
    throw new Error("VALIDATION:Product image must be a PNG, JPEG, or WebP under 2 MB.");
  }

  return {
    name,
    category: category || null,
    sku: sku || null,
    barcode: barcode || null,
    imageUrl: imageUrl || null,
    unitLabel,
    supplier: supplier || null,
    unitPrice,
    costPrice,
    currentStock,
    reorderLevel,
    trackStock: body.track_stock !== false,
    showInPos: body.show_in_pos !== false,
    status,
  };
}

export async function updateProductRecord(req: Request, res: Response) {
  try {
    if (!req.user?.user_id) return sendError(res, 401, "Authentication is required.");
    const business = await findPrimaryBusinessByUserId(req.user.user_id);
    if (!business) return sendError(res, 404, "No business workspace found.");

    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return sendError(res, 400, "Product ID is invalid.");
    }

    const existing = await findProductById(business.id, productId);
    if (!existing) return sendError(res, 404, "Product not found.");

    const input = parseProductInput(req.body);
    if (input.barcode) {
      const barcodeProduct = await findProductByBarcode(business.id, input.barcode);
      if (barcodeProduct && barcodeProduct.id !== productId) {
        return sendError(
          res,
          409,
          "This barcode is already assigned to another product."
        );
      }
    }

    const updated = await updateProduct(business.id, productId, input);
    if (!updated) return sendError(res, 404, "Product not found.");
    const product = await findProductById(business.id, productId);
    return sendSuccess(res, 200, "Product updated successfully.", product ? toProductPayload(product) : null);
  } catch (error: any) {
    if (String(error.message || "").startsWith("VALIDATION:")) {
      return sendError(res, 400, String(error.message).replace("VALIDATION:", ""));
    }
    if (error.code === "ER_DUP_ENTRY") {
      return sendError(res, 409, "Product SKU already exists in this store.");
    }
    return sendError(res, 500, "Unable to update product.", error);
  }
}

export async function checkProductBarcode(req: Request, res: Response) {
  try {
    if (!req.user?.user_id) {
      return sendError(res, 401, "Authentication is required.");
    }

    const business = await findPrimaryBusinessByUserId(req.user.user_id);
    if (!business) return sendError(res, 404, "No business workspace found.");

    const barcode = normalizeBarcode(req.params.barcode);
    if (!barcode || !isValidBarcode(barcode)) {
      return sendError(res, 400, "Barcode is invalid.");
    }

    const product = await findProductByBarcode(business.id, barcode);
    return sendSuccess(res, 200, "Barcode checked.", {
      exists: Boolean(product),
      product_id: product?.id || null,
    });
  } catch (error) {
    return sendError(res, 500, "Unable to check barcode.", error);
  }
}

export async function getProductByBarcodeRecord(req: Request, res: Response) {
  try {
    if (!req.user?.user_id) {
      return sendError(res, 401, "Authentication is required.");
    }

    const business = await findPrimaryBusinessByUserId(req.user.user_id);
    if (!business) return sendError(res, 404, "No business workspace found.");

    const barcode = normalizeBarcode(req.params.barcode);
    if (!barcode || !isValidBarcode(barcode)) {
      return sendError(res, 400, "Barcode is invalid.");
    }

    const product = await findProductByBarcode(business.id, barcode);
    if (!product) return sendError(res, 404, "No product matches this barcode.");

    return sendSuccess(res, 200, "Product found.", toProductPayload(product));
  } catch (error) {
    return sendError(res, 500, "Unable to find product by barcode.", error);
  }
}

export async function deleteProductRecord(req: Request, res: Response) {
  try {
    if (!req.user?.user_id) return sendError(res, 401, "Authentication is required.");
    const business = await findPrimaryBusinessByUserId(req.user.user_id);
    if (!business) return sendError(res, 404, "No business workspace found.");

    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId) || productId <= 0) {
      return sendError(res, 400, "Product ID is invalid.");
    }

    const deleted = await deleteProduct(business.id, productId);
    if (!deleted) return sendError(res, 404, "Product not found.");
    return sendSuccess(res, 200, "Product deleted successfully.");
  } catch (error: any) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return sendError(res, 409, "This product has sales history. Set it to inactive instead of deleting it.");
    }
    return sendError(res, 500, "Unable to delete product.", error);
  }
}
