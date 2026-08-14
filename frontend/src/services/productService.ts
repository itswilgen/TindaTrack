import api from "./api";

export const SUPPORTED_BARCODE_PATTERN = /^[A-Za-z0-9._:/+-]+$/;

export type BarcodeProduct = {
  id: number;
  name: string;
  category: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  unit_label: string;
  supplier: string | null;
  unit_price: number;
  current_stock: number;
  reorder_level: number;
  status: "active" | "inactive";
  show_in_pos: boolean;
};

export function normalizeBarcode(value: string) {
  return value.replace(/\s+/g, "").trim();
}

export function isSupportedBarcode(value: string) {
  const barcode = normalizeBarcode(value);
  return !barcode || SUPPORTED_BARCODE_PATTERN.test(barcode);
}

export async function checkProductBarcode(barcode: string) {
  const normalized = normalizeBarcode(barcode);
  const response = await api.get(
    `/products/check-barcode/${encodeURIComponent(normalized)}`,
  );

  return response.data.data as {
    exists: boolean;
    product_id: number | null;
  };
}

export async function findProductByBarcode(barcode: string) {
  const normalized = normalizeBarcode(barcode);
  const response = await api.get(
    `/products/barcode/${encodeURIComponent(normalized)}`,
  );

  return response.data.data as BarcodeProduct;
}

function ean13CheckDigit(firstTwelveDigits: string) {
  const sum = firstTwelveDigits
    .split("")
    .reduce(
      (total, digit, index) =>
        total + Number(digit) * (index % 2 === 0 ? 1 : 3),
      0,
    );

  return String((10 - (sum % 10)) % 10);
}

function createInternalEan13() {
  const random = new Uint32Array(1);
  window.crypto.getRandomValues(random);
  const firstTwelveDigits = `200${String(random[0] % 1_000_000_000).padStart(9, "0")}`;
  return `${firstTwelveDigits}${ean13CheckDigit(firstTwelveDigits)}`;
}

export async function generateAvailableBarcode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const barcode = createInternalEan13();
    const result = await checkProductBarcode(barcode);
    if (!result.exists) return barcode;
  }

  throw new Error("Unable to generate an available barcode. Please try again.");
}
