import crypto from "crypto";

const SIGNATURE_HEADERS = [
  "paymongo-signature",
  "x-paymongo-signature",
  "x-paymongo-webhook-signature",
];
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

function timingSafeEqualHex(left: string, right: string) {
  if (!/^[a-fA-F0-9]{64}$/.test(left) || !/^[a-fA-F0-9]{64}$/.test(right)) {
    return false;
  }

  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseSignatureHeader(headerValue: string) {
  const values = new Map<string, string>();

  for (const part of headerValue.split(",")) {
    const separator = part.indexOf("=");
    if (separator < 1) continue;
    values.set(part.slice(0, separator).trim(), part.slice(separator + 1).trim());
  }

  return {
    timestamp: values.get("t") || "",
    testSignature: values.get("te") || "",
    liveSignature: values.get("li") || "",
  };
}

export function verifyWebhookSignature(params: {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
  secret: string;
  nowSeconds?: number;
}) {
  const signatureHeader = SIGNATURE_HEADERS.map(
    (header) => params.headers[header]
  ).find(Boolean);

  if (!signatureHeader || Array.isArray(signatureHeader)) return false;

  const { timestamp, testSignature, liveSignature } =
    parseSignatureHeader(signatureHeader);
  const timestampNumber = Number(timestamp);
  const nowSeconds = params.nowSeconds ?? Math.floor(Date.now() / 1000);

  if (
    !Number.isInteger(timestampNumber) ||
    Math.abs(nowSeconds - timestampNumber) > MAX_WEBHOOK_AGE_SECONDS
  ) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac("sha256", params.secret)
    .update(`${timestamp}.${params.rawBody.toString("utf8")}`)
    .digest("hex");

  return [testSignature, liveSignature]
    .filter(Boolean)
    .some((signature) => timingSafeEqualHex(signature, expectedSignature));
}
