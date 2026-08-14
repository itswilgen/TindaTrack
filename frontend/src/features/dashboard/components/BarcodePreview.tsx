import { useEffect, useRef } from "react";

type BarcodePreviewProps = {
  value: string;
};

function BarcodePreview({ value }: BarcodePreviewProps) {
  const barcodeRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!barcodeRef.current || !value) return;
    let cancelled = false;

    const numericFormat = /^\d{13}$/.test(value)
      ? "EAN13"
      : /^\d{8}$/.test(value)
        ? "EAN8"
        : "CODE128";

    import("jsbarcode").then(({ default: JsBarcode }) => {
      if (cancelled || !barcodeRef.current) return;

      const renderOptions = {
        background: "transparent",
        lineColor: "#10231d",
        width: 1.7,
        height: 48,
        displayValue: true,
        font: "sans-serif",
        fontSize: 13,
        fontOptions: "bold",
        margin: 0,
      };

      try {
        JsBarcode(barcodeRef.current, value, {
          ...renderOptions,
          format: numericFormat,
        });
      } catch {
        JsBarcode(barcodeRef.current, value, {
          ...renderOptions,
          format: "CODE128",
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [value]);

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white px-4 py-3 shadow-sm">
      <svg
        ref={barcodeRef}
        aria-label={`Barcode ${value}`}
        className="mx-auto block max-w-full"
        role="img"
      />
    </div>
  );
}

export default BarcodePreview;
