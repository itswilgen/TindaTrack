export function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

export function isSafeCheckoutSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{8,120}$/.test(value);
}

export const INPUT_LIMITS = Object.freeze({
  name: 150,
  email: 150,
  passwordBytes: 72,
  businessName: 150,
  businessType: 100,
  phone: 30,
  address: 500,
  sku: 80,
  barcode: 100,
  unit: 50,
  supplier: 150,
  notes: 500,
  imageDataUrl: 2_800_000,
  logoDataUrl: 700_000,
});

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const barcodePattern = /^[A-Za-z0-9._:/+\-]+$/;
const safeImageDataUrlPattern = /^data:image\/(?:png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

export function normalizeEmail(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

export function normalizePhilippinePhone(value: unknown) {
  const digits = String(value || "").replace(/\D/g, "");

  if (/^09\d{9}$/.test(digits)) return `+63${digits.slice(1)}`;
  if (/^639\d{9}$/.test(digits)) return `+${digits}`;
  return "";
}

export function normalizeBarcode(value: unknown) {
  return String(value || "").replace(/\s+/g, "").trim();
}

export function isValidEmail(email: string) {
  return email.length <= INPUT_LIMITS.email && emailPattern.test(email);
}

export function isValidPassword(password: string) {
  const byteLength = Buffer.byteLength(password, "utf8");
  return password.length >= 8 && byteLength <= INPUT_LIMITS.passwordBytes;
}

export function isValidBarcode(barcode: string) {
  return (
    !barcode ||
    (barcode.length <= INPUT_LIMITS.barcode && barcodePattern.test(barcode))
  );
}

export function isWithinLength(value: string, maximum: number) {
  return value.length <= maximum;
}

export function isValidProductImage(value: string) {
  if (!value) return true;
  if (value.length > INPUT_LIMITS.imageDataUrl) return false;
  if (safeImageDataUrlPattern.test(value)) return true;

  try {
    const url = new URL(value, "https://tindatrack.local");
    return (
      url.protocol === "https:" ||
      (url.origin === "https://tindatrack.local" && value.startsWith("/"))
    );
  } catch {
    return false;
  }
}

export function isValidStoreLogo(value: string) {
  return (
    !value ||
    (value.length <= INPUT_LIMITS.logoDataUrl && safeImageDataUrlPattern.test(value))
  );
}
