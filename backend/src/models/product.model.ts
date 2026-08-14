import { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import db from "../config/db";

export type ProductStatus = "active" | "inactive";

export type ProductRow = RowDataPacket & {
  id: number;
  business_id: number;
  name: string;
  category: string | null;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  unit_label: string | null;
  supplier: string | null;
  unit_price: string | number;
  cost_price: string | number;
  current_stock: string | number;
  reorder_level: string | number;
  track_stock: number;
  show_in_pos: number;
  status: ProductStatus;
  created_at: Date;
  updated_at: Date;
};

export type CreateProductInput = {
  businessId: number;
  name: string;
  category?: string | null;
  sku?: string | null;
  barcode?: string | null;
  imageUrl?: string | null;
  unitLabel?: string | null;
  supplier?: string | null;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  reorderLevel: number;
  trackStock: boolean;
  showInPos: boolean;
  status: ProductStatus;
};

export type UpdateProductInput = Omit<CreateProductInput, "businessId">;

export async function getProductsByBusinessId(businessId: number) {
  const [rows] = await db.query<ProductRow[]>(
    `
    SELECT *
    FROM products
    WHERE business_id = ?
    ORDER BY updated_at DESC, name ASC
    `,
    [businessId]
  );

  return rows;
}

export async function createProduct(data: CreateProductInput) {
  const [result] = await db.query<ResultSetHeader>(
    `
    INSERT INTO products (
      business_id,
      name,
      category,
      sku,
      barcode,
      image_url,
      unit_label,
      supplier,
      unit_price,
      cost_price,
      current_stock,
      reorder_level,
      track_stock,
      show_in_pos,
      status
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      data.businessId,
      data.name,
      data.category || null,
      data.sku || null,
      data.barcode || null,
      data.imageUrl || null,
      data.unitLabel || "Piece",
      data.supplier || null,
      data.unitPrice,
      data.costPrice,
      data.currentStock,
      data.reorderLevel,
      data.trackStock ? 1 : 0,
      data.showInPos ? 1 : 0,
      data.status,
    ]
  );

  return result.insertId;
}

export async function findProductById(businessId: number, productId: number) {
  const [rows] = await db.query<ProductRow[]>(
    `
    SELECT *
    FROM products
    WHERE business_id = ?
      AND id = ?
    LIMIT 1
    `,
    [businessId, productId]
  );

  return rows[0] || null;
}

export async function findProductByBarcode(
  businessId: number,
  barcode: string
) {
  const [rows] = await db.query<ProductRow[]>(
    `
    SELECT *
    FROM products
    WHERE business_id = ?
      AND barcode = ?
    LIMIT 1
    `,
    [businessId, barcode]
  );

  return rows[0] || null;
}

export async function updateProduct(
  businessId: number,
  productId: number,
  data: UpdateProductInput
) {
  const [result] = await db.query<ResultSetHeader>(
    `
    UPDATE products
    SET name = ?, category = ?, sku = ?, barcode = ?, image_url = ?,
        unit_label = ?, supplier = ?, unit_price = ?, cost_price = ?,
        current_stock = ?, reorder_level = ?, track_stock = ?,
        show_in_pos = ?, status = ?
    WHERE business_id = ? AND id = ?
    `,
    [
      data.name,
      data.category || null,
      data.sku || null,
      data.barcode || null,
      data.imageUrl || null,
      data.unitLabel || "Piece",
      data.supplier || null,
      data.unitPrice,
      data.costPrice,
      data.currentStock,
      data.reorderLevel,
      data.trackStock ? 1 : 0,
      data.showInPos ? 1 : 0,
      data.status,
      businessId,
      productId,
    ]
  );

  return result.affectedRows > 0;
}

export async function deleteProduct(businessId: number, productId: number) {
  const [result] = await db.query<ResultSetHeader>(
    "DELETE FROM products WHERE business_id = ? AND id = ?",
    [businessId, productId]
  );

  return result.affectedRows > 0;
}
