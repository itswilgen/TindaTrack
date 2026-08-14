import {
  AlertTriangle,
  Barcode,
  Boxes,
  Package,
  PackageCheck,
  Search,
  TrendingDown,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import api from "../../../services/api";
import { findProductByBarcode } from "../../../services/productService";
import BarcodeScannerModal from "../../../components/BarcodeScannerModal";
import OwnerPageShell from "../components/OwnerPageShell";
import CompactMetricCard from "../components/CompactMetricCard";
import { PageLoadingState } from "../../../components/LoadingSpinner";

type Product = {
  id: number;
  name: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  unit_label: string;
  supplier: string | null;
  current_stock: number;
};
type Movement = {
  id: number;
  product: string;
  sku: string | null;
  unit_label: string | null;
  movement_type: string;
  quantity: number;
  notes: string | null;
  staff: string;
  created_at: string;
};
type LowStock = {
  id: number;
  product: string;
  sku: string | null;
  unit_label: string | null;
  stock: number;
  reorder_level: number;
};
type InventoryData = {
  stats: {
    total_units: number;
    low_stock: number;
    stock_in_today: number;
    stock_value: number;
  };
  low_stock: LowStock[];
  movements: Movement[];
};
function peso(value: number) {
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function InventoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<InventoryData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [form, setForm] = useState({ product_id: "", quantity: "", notes: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  async function load() {
    try {
      setError("");
      const [inventoryResponse, productResponse] = await Promise.all([
        api.get("/operations/inventory"),
        api.get("/products"),
      ]);
      setData(inventoryResponse.data.data);
      setProducts(productResponse.data.data.products || []);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message || "Unable to load inventory.",
      );
    } finally {
      setIsLoadingInventory(false);
    }
  }

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (searchParams.get("stock-in") === "1") {
      const requestedProductId = Number(searchParams.get("product_id"));
      openStockIn(
        Number.isInteger(requestedProductId) && requestedProductId > 0
          ? requestedProductId
          : undefined,
      );
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);
  const movements = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data?.movements || [];
    return (data?.movements || []).filter((item) =>
      `${item.product} ${item.sku || ""} ${item.movement_type} ${item.notes || ""}`
        .toLowerCase()
        .includes(term),
    );
  }, [data, search]);
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === Number(form.product_id)),
    [form.product_id, products],
  );
  const projectedStock = selectedProduct
    ? selectedProduct.current_stock + Number(form.quantity || 0)
    : 0;

  function openStockIn(productId?: number) {
    setForm({
      product_id: productId ? String(productId) : "",
      quantity: "",
      notes: "",
    });
    setError("");
    setIsOpen(true);
  }

  async function submitStockIn(event: React.FormEvent) {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      await api.post("/operations/inventory/stock-in", {
        ...form,
        product_id: Number(form.product_id),
        quantity: Number(form.quantity),
      });
      setMessage("Stock-in saved and inventory quantity updated.");
      setIsOpen(false);
      await load();
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message || "Unable to save stock-in.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function searchProductByBarcode(barcode: string) {
    try {
      setError("");
      const product = await findProductByBarcode(barcode);
      setSearch(product.sku || product.name);
      setMessage(`${product.name} found from barcode scan.`);
    } catch (requestError: any) {
      setError(
        requestError.response?.data?.message ||
          "No product matches the scanned barcode.",
      );
    }
  }

  function openScanner() {
    setIsScannerOpen(true);
  }

  const stats = [
    {
      label: "Total stock units",
      value: data?.stats.total_units.toLocaleString("en-PH") || "0",
      detail: "Across tracked products",
      icon: Package,
      tone: "leaf" as const,
    },
    {
      label: "Low stock items",
      value: data?.stats.low_stock.toLocaleString("en-PH") || "0",
      detail: "Below reorder level",
      icon: AlertTriangle,
      tone: "amber" as const,
    },
    {
      label: "Stock-in today",
      value: data?.stats.stock_in_today.toLocaleString("en-PH") || "0",
      detail: "New units recorded",
      icon: PackageCheck,
      tone: "sage" as const,
    },
    {
      label: "Stock value",
      value: peso(data?.stats.stock_value || 0),
      detail: "Inventory at cost",
      icon: Wallet,
      tone: "leaf" as const,
    },
  ];

  if (isLoadingInventory) {
    return <PageLoadingState fullScreen label="Loading inventory data..." />;
  }

  return (
    <OwnerPageShell
      badge={
        <>
          <Boxes size={14} />
          Inventory control
        </>
      }
      description="Monitor stock levels, record stock-in, and review every inventory movement."
      title="Inventory"
      topLabel="Operations"
    >
      {error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="mt-5 rounded-xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf-dark">
          {message}
        </div>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <CompactMetricCard
            key={stat.label}
            detail={stat.detail}
            icon={stat.icon}
            label={stat.label}
            tone={stat.tone}
            value={stat.value}
          />
        ))}
      </div>
      <div className="mt-5 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="overflow-hidden rounded-xl border border-ink-line bg-white sm:rounded-2xl">
          <div className="border-b border-ink-line p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_11rem]">
              <label className="flex h-11 items-center gap-3 rounded-xl border border-ink-line px-4 text-sm font-semibold text-ink-soft shadow-sm">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full bg-transparent outline-none"
                  placeholder="Search inventory movements"
                  type="search"
                />
              </label>
              <button
                type="button"
                onClick={openScanner}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-leaf/35 bg-leaf/5 px-4 text-sm font-black text-leaf-dark transition hover:bg-leaf/10"
              >
                <Barcode size={17} />
                <span className="md:hidden xl:inline">Scan search</span>
              </button>
              <button
                onClick={() => openStockIn()}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-leaf px-4 text-sm font-black text-white"
              >
                <PackageCheck size={17} />
                Stock in
              </button>
            </div>
          </div>
          {movements.length === 0 && (
            <p className="border-t border-ink-line p-8 text-center text-sm font-bold text-ink-soft">
              No inventory movements found.
            </p>
          )}
          <div className="divide-y divide-ink-line md:hidden">
            {movements.map((movement) => (
              <div key={movement.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-ink">
                      {movement.product}
                    </p>
                    <p className="mt-1 text-xs font-bold text-ink-soft">
                      {new Date(movement.created_at).toLocaleString("en-PH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[0.68rem] font-black capitalize ${movement.movement_type === "stock_in" ? "bg-leaf/10 text-leaf-dark" : "bg-amber/10 text-amber"}`}
                  >
                    {movement.movement_type.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <p className="text-xs font-bold text-ink-soft">
                    By {movement.staff}
                  </p>
                  <p className="shrink-0 font-black text-pine">
                    {Number(movement.quantity) > 0 ? "+" : ""}
                    {Number(movement.quantity)} {movement.unit_label || "units"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[9rem_minmax(0,1.5fr)_8rem_8rem_10rem] bg-paper-dim/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-ink-soft">
                <span>Date</span>
                <span>Product</span>
                <span>Type</span>
                <span>Quantity</span>
                <span>Staff</span>
              </div>
              {movements.map((movement) => (
                <div
                  key={movement.id}
                  className="grid grid-cols-[9rem_minmax(0,1.5fr)_8rem_8rem_10rem] items-center border-t border-ink-line px-4 py-3 text-sm"
                >
                  <span className="text-xs font-bold text-ink-soft">
                    {new Date(movement.created_at).toLocaleString("en-PH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="truncate font-black text-ink">
                    {movement.product}
                  </span>
                  <span
                    className={
                      movement.movement_type === "stock_in"
                        ? "font-black text-leaf-dark"
                        : "font-black text-amber"
                    }
                  >
                    {movement.movement_type.replace("_", " ")}
                  </span>
                  <span className="font-black text-ink">
                    {Number(movement.quantity) > 0 ? "+" : ""}
                    {Number(movement.quantity)} {movement.unit_label || "units"}
                  </span>
                  <span className="text-xs font-bold text-ink-soft">
                    {movement.staff}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="self-start rounded-2xl border border-amber/25 bg-amber/5 p-4 xl:sticky xl:top-24">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber/10 text-amber">
              <AlertTriangle size={20} />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold text-pine">
                Restock list
              </h3>
              <p className="text-xs font-bold text-ink-soft">
                Products below reorder level
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {(data?.low_stock || []).length === 0 && (
              <p className="rounded-xl border border-ink-line bg-white p-4 text-sm font-bold text-ink-soft">
                All tracked products have enough stock.
              </p>
            )}
            {(data?.low_stock || []).map((item) => (
              <button
                key={item.id}
                onClick={() => openStockIn(item.id)}
                className="w-full rounded-xl border border-ink-line bg-white p-3 text-left transition hover:border-leaf/40"
              >
                <p className="truncate text-sm font-black text-ink">
                  {item.product}
                </p>
                <p className="mt-1 font-mono text-xs text-ink-soft">
                  {item.sku || "No SKU"}
                </p>
                <div className="mt-3 flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1 text-amber">
                    <TrendingDown size={14} />
                    {Number(item.stock)} left
                  </span>
                  <span className="text-leaf-dark">Stock in</span>
                </div>
              </button>
            ))}
          </div>
        </aside>
      </div>
      {isOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden overscroll-none bg-pine/45 p-3 backdrop-blur-sm">
          <form
            onSubmit={submitStockIn}
            className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-2xl sm:p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-black uppercase text-leaf-dark">
                  Inventory movement
                </p>
                <h3 className="mt-1 font-display text-2xl font-bold text-pine">
                  Record stock-in
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-line"
              >
                <X size={17} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-black uppercase text-ink-soft">
                Product
                <select
                  required
                  value={form.product_id}
                  onChange={(event) =>
                    setForm({ ...form, product_id: event.target.value })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-ink-line bg-white px-3 text-base font-semibold sm:text-sm"
                >
                  <option value="">Select product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.current_stock}{" "}
                      {product.unit_label})
                    </option>
                  ))}
                </select>
              </label>

              {selectedProduct && (
                <div className="grid grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-xl border border-ink-line bg-paper p-3">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-ink-line bg-white">
                    {selectedProduct.image_url ? (
                      <img
                        alt=""
                        className="h-full w-full object-cover"
                        src={selectedProduct.image_url}
                      />
                    ) : (
                      <Package className="text-leaf-dark" size={22} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-ink">
                      {selectedProduct.name}
                    </p>
                    <p className="mt-1 text-xs font-bold text-ink-soft">
                      Current stock: {selectedProduct.current_stock}{" "}
                      {selectedProduct.unit_label}
                    </p>
                    <p className="mt-1 truncate text-xs font-semibold text-ink-soft">
                      Supplier: {selectedProduct.supplier || "Not assigned"}
                    </p>
                  </div>
                </div>
              )}

              <label className="block text-xs font-black uppercase text-ink-soft">
                Received quantity
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  value={form.quantity}
                  onChange={(event) =>
                    setForm({ ...form, quantity: event.target.value })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-ink-line px-3 text-base font-semibold sm:text-sm"
                />
              </label>
              {selectedProduct && form.quantity && (
                <div className="flex items-center justify-between rounded-xl bg-leaf/10 px-4 py-3 text-sm font-black">
                  <span className="text-ink-soft">New stock</span>
                  <span className="text-leaf-dark">
                    {projectedStock} {selectedProduct.unit_label}
                  </span>
                </div>
              )}
              <label className="block text-xs font-black uppercase text-ink-soft">
                Notes
                <input
                  value={form.notes}
                  onChange={(event) =>
                    setForm({ ...form, notes: event.target.value })
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-ink-line px-3 text-base font-semibold sm:text-sm"
                  placeholder="Supplier or delivery reference"
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="h-11 w-full rounded-xl border border-ink-line px-4 text-sm font-black sm:w-auto"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="h-11 w-full rounded-xl bg-leaf px-5 text-sm font-black text-white sm:w-auto"
              >
                {saving ? "Saving..." : "Confirm stock-in"}
              </button>
            </div>
          </form>
          </div>,
          document.body,
        )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(barcode) => void searchProductByBarcode(barcode)}
        title="Scan Inventory Barcode"
      />
    </OwnerPageShell>
  );
}
export default InventoryPage;
