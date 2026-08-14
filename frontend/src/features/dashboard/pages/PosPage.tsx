import {
  Banknote,
  Barcode,
  CheckCircle2,
  ChevronRight,
  Coffee,
  Egg,
  House,
  Milk,
  Minus,
  Package,
  Pencil,
  Plus,
  Search,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import gcashLogo from "../../../assets/images/Gcash.png";
import mastercardLogo from "../../../assets/images/Mastercard.png";
import { STORAGE_KEYS } from "../../../constants/storage";
import api from "../../../services/api";
import { findProductByBarcode } from "../../../services/productService";
import { readJson } from "../../../utils/storage";
import BarcodeScannerModal from "../../../components/BarcodeScannerModal";
import OwnerSidebar from "../components/OwnerSidebar";
import { PageLoadingState } from "../../../components/LoadingSpinner";

type PosProduct = {
  id: number;
  name: string;
  category: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  unit_label: string;
  price: string;
  unit_price: number;
  current_stock: number;
  reorder_level: number;
  stock_label: string;
};

type CartItem = {
  product: PosProduct;
  quantity: number;
  unitLabel: string;
};

type PaymentMethodOption = {
  label: string;
  value: "cash" | "gcash" | "card";
  icon?: LucideIcon;
  logo?: string;
  logoClassName?: string;
};

const paymentMethods: PaymentMethodOption[] = [
  { label: "Cash", value: "cash", icon: Banknote },
  {
    label: "GCash",
    value: "gcash",
    logo: gcashLogo,
    logoClassName: "h-4 w-auto max-w-[4.5rem] sm:h-5",
  },
  {
    label: "Card",
    value: "card",
    logo: mastercardLogo,
    logoClassName: "h-5 w-auto sm:h-6",
  },
];

const CATEGORY_PAGE_SIZE = 5;
const cartUnitOptions = ["Piece", "Pack", "1 kilo", "5 kilo", "10 kilo"];

function formatPeso(value: number) {
  return `₱${value.toLocaleString("en-PH", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`;
}

function getUnitMultiplier(unitLabel: string) {
  if (unitLabel === "5 kilo") return 5;
  if (unitLabel === "10 kilo") return 10;
  return 1;
}

function getCategoryIcon(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes("beverage")) return Coffee;
  if (normalized.includes("fresh")) return Egg;
  if (normalized.includes("dairy")) return Milk;
  if (normalized.includes("household")) return House;
  if (normalized.includes("coffee")) return Coffee;

  return Package;
}

function BlankItemImage({
  imageUrl,
  small = false,
}: {
  imageUrl?: string | null;
  small?: boolean;
}) {
  return (
    <div
      className={`shrink-0 overflow-hidden rounded-lg border border-ink-line bg-white ${
        small ? "h-12 w-14" : "h-24 w-full"
      }`}
      aria-hidden="true"
    >
      {imageUrl && (
        <img alt="" className="h-full w-full object-cover" src={imageUrl} />
      )}
    </div>
  );
}

function CartCard({
  cartItems,
  onQuantityChange,
  onRemove,
  onClear,
  onUnitChange,
}: {
  cartItems: CartItem[];
  onQuantityChange: (productId: number, quantity: number) => void;
  onRemove: (productId: number) => void;
  onClear: () => void;
  onUnitChange: (productId: number, unitLabel: string) => void;
}) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-ink-line bg-white p-3 shadow-[0_12px_34px_rgba(15,111,87,0.05)] sm:min-h-100 sm:rounded-2xl sm:p-4 lg:col-span-3 lg:h-188">
      <div className="flex items-center justify-between border-b border-ink-line pb-2.5">
        <h2 className="font-display text-base font-bold text-ink sm:text-lg">
          Current Sale ({cartItems.length} items)
        </h2>
        <button
          type="button"
          onClick={onClear}
          disabled={cartItems.length === 0}
          className="flex items-center gap-1.5 text-xs font-black text-red-500"
        >
          <Trash2 size={14} />
          Clear Cart
        </button>
      </div>

      <div className="scrollbar-hidden min-h-0 flex-1 overscroll-contain lg:overflow-y-auto lg:pr-1">
        {cartItems.length === 0 && (
          <div className="flex h-full min-h-48 items-center justify-center text-center text-sm font-bold text-ink-soft">
            Add products from the catalog below.
          </div>
        )}

        {cartItems.map((item) => (
          <div
            key={item.product.id}
            className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-ink-line py-3 last:border-b-0 sm:grid-cols-12 sm:gap-3 sm:py-2.5"
          >
            <div className="sm:col-span-2">
              <BlankItemImage imageUrl={item.product.image_url} small />
            </div>

            <div className="min-w-0 sm:col-span-4">
              <h3 className="truncate text-sm font-black text-ink">
                {item.product.name}
              </h3>
              <p className="mt-1.5 text-xs font-black text-ink">
                {item.product.price}
              </p>
            </div>

            <div className="col-span-2 col-start-2 grid grid-cols-[6.25rem_minmax(0,1fr)] gap-2 sm:col-span-3 sm:col-start-auto">
              <div
                className="flex h-8 items-center overflow-hidden rounded-lg border border-ink-line bg-white"
                aria-label={`${item.product.name} quantity`}
              >
                <button
                  type="button"
                  onClick={() =>
                    onQuantityChange(item.product.id, item.quantity - 1)
                  }
                  disabled={item.quantity <= 1}
                  className="flex h-full w-8 shrink-0 items-center justify-center text-ink-soft transition hover:bg-paper hover:text-pine disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={`Decrease ${item.product.name} quantity`}
                >
                  <Minus size={14} />
                </button>
                <span className="flex h-full min-w-0 flex-1 items-center justify-center border-x border-ink-line text-xs font-black text-ink">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onQuantityChange(item.product.id, item.quantity + 1)
                  }
                  disabled={
                    item.quantity >=
                    Math.max(
                      Math.floor(
                        item.product.current_stock /
                          getUnitMultiplier(item.unitLabel),
                      ),
                      1,
                    )
                  }
                  className="flex h-full w-8 shrink-0 items-center justify-center text-leaf-dark transition hover:bg-leaf/10 disabled:cursor-not-allowed disabled:opacity-35"
                  aria-label={`Increase ${item.product.name} quantity`}
                >
                  <Plus size={14} />
                </button>
              </div>
              <select
                aria-label={`${item.product.name} unit`}
                className="h-8 min-w-0 rounded-lg border border-ink-line bg-white px-2 text-xs font-black text-ink outline-none focus:border-leaf"
                onChange={(event) =>
                  onUnitChange(item.product.id, event.target.value)
                }
                value={item.unitLabel}
              >
                {Array.from(
                  new Set([item.product.unit_label, ...cartUnitOptions]),
                ).map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-start-3 row-start-1 flex flex-col-reverse items-end justify-center gap-1 sm:col-span-3 sm:col-start-auto sm:row-start-auto sm:flex-row sm:items-center sm:gap-3">
              <p className="text-xs font-black text-ink sm:text-sm">
                {formatPeso(
                  item.product.unit_price *
                    item.quantity *
                    getUnitMultiplier(item.unitLabel),
                )}
              </p>
              <button
                type="button"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-ink-line text-ink-soft"
                onClick={() => onRemove(item.product.id)}
                aria-label={`Remove ${item.product.name}`}
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CashierCard({
  cashReceived,
  discount,
  isSubmitting,
  onCashReceivedChange,
  onCompleteSale,
  onDiscountChange,
  onPaymentMethodChange,
  paymentMethod,
  subtotal,
  total,
}: {
  cashReceived: string;
  discount: string;
  isSubmitting: boolean;
  onCashReceivedChange: (value: string) => void;
  onCompleteSale: () => void;
  onDiscountChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  paymentMethod: string;
  subtotal: number;
  total: number;
}) {
  const change =
    paymentMethod === "cash"
      ? Math.max(Number(cashReceived || 0) - total, 0)
      : 0;

  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-ink-line bg-white p-3 shadow-[0_12px_34px_rgba(15,111,87,0.05)] sm:min-h-100 sm:rounded-2xl sm:p-4 lg:col-span-2 lg:h-188">
      <div className="space-y-2.5 text-sm font-black sm:text-base">
        <div className="flex justify-between text-ink">
          <span>Subtotal</span>
          <span>{formatPeso(subtotal)}</span>
        </div>
        <div className="flex justify-between text-ink">
          <span className="flex items-center gap-2">
            Discount
            <Pencil size={15} className="text-ink-line" />
          </span>
          <input
            className="w-28 rounded-lg border border-ink-line px-2 py-1 text-right text-sm font-black text-leaf outline-none focus:border-leaf"
            min="0"
            onChange={(event) => onDiscountChange(event.target.value)}
            type="number"
            value={discount}
          />
        </div>
        <div className="flex justify-between pt-1 font-display text-xl font-bold text-pine">
          <span>Total</span>
          <span>{formatPeso(total)}</span>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm font-black text-ink sm:text-base">
          Payment Method
        </p>
        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          {paymentMethods.map(
            ({ label, value, icon: Icon, logo, logoClassName }) => (
              <button
                key={value}
                type="button"
                onClick={() => onPaymentMethodChange(value)}
                aria-pressed={paymentMethod === value}
                className={`flex h-14 flex-col items-center justify-center gap-1 rounded-xl border text-xs font-black transition sm:h-16 sm:gap-1.5 sm:text-sm ${
                  paymentMethod === value && value === "cash"
                    ? "border-leaf bg-leaf text-white shadow-md shadow-leaf/20"
                    : paymentMethod === value
                      ? "border-leaf bg-leaf/5 text-pine ring-1 ring-leaf/15"
                      : value === "cash"
                        ? "border-leaf/35 bg-leaf/5 text-leaf-dark hover:border-leaf hover:bg-leaf/10"
                        : "border-ink-line bg-white text-ink hover:border-leaf/40"
                }`}
              >
                {logo ? (
                  <img
                    alt=""
                    aria-hidden="true"
                    className={`object-contain ${logoClassName || "h-5 w-auto"}`}
                    src={logo}
                  />
                ) : (
                  Icon && <Icon size={23} />
                )}
                {label}
              </button>
            ),
          )}
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-3 sm:grid-cols-[1fr_10rem]">
          <p className="text-sm font-black text-ink sm:text-base">
            Cash Received
          </p>
          <input
            className="rounded-xl border border-ink-line bg-leaf/5 px-4 py-2 text-right text-base font-black text-leaf outline-none focus:border-leaf"
            min="0"
            onChange={(event) => onCashReceivedChange(event.target.value)}
            type="number"
            value={cashReceived}
          />
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_8rem] items-center gap-3 sm:grid-cols-[1fr_10rem]">
          <p className="text-sm font-black text-ink sm:text-base">Change</p>
          <div className="rounded-xl px-4 py-2 text-right text-lg font-black text-leaf">
            {formatPeso(change)}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={onCompleteSale}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-green-600 text-sm font-black text-white shadow-lg shadow-green-700/20 transition hover:bg-green-700 sm:mt-auto sm:text-base"
      >
        <CheckCircle2 size={22} />
        {isSubmitting ? "Saving Sale..." : "Complete Sale"}
      </button>
    </section>
  );
}

function ProductCatalog({
  categories,
  isLoading,
  onAddProduct,
  onScanBarcode,
  onSearchChange,
  products,
  search,
}: {
  categories: string[];
  isLoading: boolean;
  onAddProduct: (product: PosProduct) => void;
  onScanBarcode: () => void;
  onSearchChange: (value: string) => void;
  products: PosProduct[];
  search: string;
}) {
  const [categoryPage, setCategoryPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const categoryOptions = useMemo(
    () => [
      { label: "All Categories", icon: Tag, active: false },
      ...categories.map((category) => ({
        label: category,
        icon: getCategoryIcon(category),
        active: false,
      })),
    ],
    [categories],
  );
  const categoryPageCount = Math.max(
    Math.ceil(categoryOptions.length / CATEGORY_PAGE_SIZE),
    1,
  );
  const visibleCategories = categoryOptions.slice(
    categoryPage * CATEGORY_PAGE_SIZE,
    categoryPage * CATEGORY_PAGE_SIZE + CATEGORY_PAGE_SIZE,
  );
  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "All Categories" ||
        product.category === selectedCategory;
      const matchesSearch =
        !term ||
        `${product.name} ${product.sku || ""} ${product.barcode || ""}`
          .toLowerCase()
          .includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, search, selectedCategory]);

  function showNextCategories() {
    setCategoryPage((page) => (page + 1) % categoryPageCount);
  }

  return (
    <section className="rounded-xl border border-ink-line bg-white p-3 sm:rounded-2xl sm:p-4">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <label className="flex h-14 min-w-0 flex-1 items-center gap-3 rounded-xl border-2 border-ink-line bg-white px-4 text-base font-semibold text-ink-soft shadow-sm transition focus-within:border-leaf focus-within:ring-4 focus-within:ring-leaf/10 sm:h-12 sm:border sm:text-sm">
          <Search size={20} className="shrink-0 sm:h-4.5 sm:w-4.5" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="h-full w-full min-w-0 appearance-none bg-transparent outline-none placeholder:text-ink-soft/70"
            placeholder="Search products..."
            type="search"
          />
        </label>

        <button
          type="button"
          onClick={onScanBarcode}
          className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-leaf/40 bg-white px-5 text-sm font-black text-leaf-dark shadow-sm transition hover:bg-leaf/5 sm:w-auto"
        >
          <Barcode size={18} />
          Scan Barcode
        </button>
      </div>

      <div className="mt-3 flex gap-2.5">
        <div className="grid flex-1 grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          {visibleCategories.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedCategory(label)}
              className={`flex h-10 min-w-0 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-black transition ${
                selectedCategory === label
                  ? "border-leaf bg-leaf text-white shadow-md shadow-leaf/15"
                  : "border-ink-line bg-white text-ink hover:border-leaf/35"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={showNextCategories}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-line bg-white text-ink-soft transition hover:border-leaf/40 hover:text-pine"
          aria-label="Show more categories"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {isLoading && (
          <div className="rounded-xl border border-ink-line bg-white p-5 text-center text-sm font-bold text-ink-soft">
            Loading products from database...
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="rounded-xl border border-ink-line bg-white p-5 text-center text-sm font-bold text-ink-soft">
            No POS products available. Add a product and enable Show in POS.
          </div>
        )}

        {!isLoading &&
          filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onAddProduct(product)}
              className="grid w-full grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 rounded-xl border border-ink-line bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,111,87,0.04)] transition hover:border-leaf/35 hover:shadow-[0_16px_30px_rgba(15,111,87,0.08)] md:grid-cols-[4.5rem_minmax(0,1fr)_8rem_9rem_6.5rem] md:gap-3"
            >
              <BlankItemImage imageUrl={product.image_url} small />

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-xs font-black leading-5 text-ink">
                    {product.name}
                  </h3>
                  <Star className="shrink-0 text-ink-line" size={14} />
                </div>
                <p className="mt-0.5 text-[0.68rem] font-semibold text-ink-soft">
                  Product item
                </p>
              </div>

              <p className="text-right text-xs font-black text-ink">
                {product.price}
              </p>

              <div className="col-start-2 row-start-2 md:col-start-auto md:row-start-auto md:flex md:justify-end">
                <span
                  className={`inline-flex w-fit rounded-md px-2 py-1 text-[0.68rem] font-black ${
                    product.current_stock <= product.reorder_level
                      ? "bg-red-100 text-red-500"
                      : "bg-leaf/10 text-leaf-dark"
                  }`}
                >
                  {product.stock_label}
                </span>
              </div>

              <div className="col-start-3 row-start-2 flex h-7 items-center justify-between gap-2 rounded-lg border border-leaf/40 px-2.5 text-xs font-black text-leaf-dark md:col-start-auto md:row-start-auto">
                Add
                <Plus size={15} />
              </div>
            </button>
          ))}

        {[0, 1].map((slot) => (
          <div
            key={slot}
            className="grid min-h-14 grid-cols-[4.5rem_minmax(0,1fr)_6.5rem] items-center gap-3 rounded-xl border border-dashed border-ink-line bg-white p-3 text-xs font-black text-ink-soft"
          >
            <BlankItemImage small />
            <span>Empty product slot</span>
            <span className="text-right">Empty</span>
          </div>
        ))}
      </div>
    </section>
  );
}
function PosPage() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [cashReceived, setCashReceived] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [posMessage, setPosMessage] = useState("");
  const [posError, setPosError] = useState("");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<{
    receipt_number: string;
    total_amount: number;
    change_due: number | null;
  } | null>(null);
  const user = readJson<{ name?: string; email?: string }>(STORAGE_KEYS.user);
  const ownerName = user?.name || "Demo Owner";
  const initial = ownerName.charAt(0).toUpperCase();
  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum +
      item.product.unit_price *
        item.quantity *
        getUnitMultiplier(item.unitLabel),
    0,
  );
  const total = Math.max(subtotal - Number(discount || 0), 0);

  async function loadCatalog() {
    try {
      setIsLoadingCatalog(true);
      setPosError("");

      const response = await api.get("/pos/catalog");
      const data = response.data.data;

      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch (error: any) {
      setPosError(
        error.response?.data?.message ||
          "Unable to load POS catalog from the database.",
      );
    } finally {
      setIsLoadingCatalog(false);
    }
  }

  useEffect(() => {
    loadCatalog();
  }, []);

  function addProductToCart(product: PosProduct) {
    const existingItem = cartItems.find(
      (item) => item.product.id === product.id,
    );

    if (product.current_stock <= 0) {
      setPosError(`${product.name} is out of stock.`);
      return false;
    }

    if (existingItem && existingItem.quantity >= product.current_stock) {
      setPosError(
        `Only ${product.current_stock} ${product.unit_label} of ${product.name} are available.`,
      );
      return false;
    }

    setPosError("");
    setCartItems((currentItems) => {
      const currentItem = currentItems.find(
        (item) => item.product.id === product.id,
      );

      if (currentItem) {
        return currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [
        ...currentItems,
        {
          product,
          quantity: 1,
          unitLabel: product.unit_label || "Piece",
        },
      ];
    });

    return true;
  }

  async function addScannedProduct(barcode: string) {
    try {
      setPosError("");
      const product = await findProductByBarcode(barcode);

      if (product.status !== "active") {
        setPosError(`${product.name} is inactive and cannot be sold.`);
        return;
      }

      if (!product.show_in_pos) {
        setPosError(`${product.name} is not available in POS.`);
        return;
      }

      if (product.current_stock <= 0) {
        setPosError(`${product.name} is out of stock.`);
        return;
      }

      const catalogProduct = products.find(
        (item) => item.id === product.id,
      ) || {
        id: product.id,
        name: product.name,
        category: product.category,
        sku: product.sku,
        barcode: product.barcode,
        image_url: product.image_url,
        unit_label: product.unit_label,
        price: formatPeso(product.unit_price),
        unit_price: product.unit_price,
        current_stock: product.current_stock,
        reorder_level: product.reorder_level,
        stock_label:
          product.current_stock <= product.reorder_level
            ? `Low Stock (${product.current_stock})`
            : `In Stock (${product.current_stock})`,
      };

      if (addProductToCart(catalogProduct)) {
        setPosMessage(`${product.name} added from barcode scan.`);
      }
    } catch (requestError: any) {
      setPosError(
        requestError.response?.data?.message ||
          "No product matches the scanned barcode.",
      );
    }
  }

  function updateCartQuantity(productId: number, quantity: number) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: Math.min(
                Math.max(Math.trunc(quantity), 1),
                Math.max(
                  Math.floor(
                    item.product.current_stock /
                      getUnitMultiplier(item.unitLabel),
                  ),
                  1,
                ),
              ),
            }
          : item,
      ),
    );
  }

  function updateCartUnit(productId: number, unitLabel: string) {
    setCartItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              unitLabel,
              quantity: Math.min(
                item.quantity,
                Math.max(
                  Math.floor(
                    item.product.current_stock / getUnitMultiplier(unitLabel),
                  ),
                  1,
                ),
              ),
            }
          : item,
      ),
    );
  }

  function removeCartItem(productId: number) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== productId),
    );
  }

  async function completeSale() {
    setPosError("");
    setPosMessage("");

    if (cartItems.length === 0) {
      setPosError("Add at least one product before completing a sale.");
      return;
    }

    if (paymentMethod === "cash" && Number(cashReceived || 0) < total) {
      setPosError("Cash received must be equal to or greater than the total.");
      return;
    }

    try {
      setIsSubmittingSale(true);

      const response = await api.post("/pos/sales", {
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_label: item.unitLabel,
        })),
        payment_method: paymentMethod,
        discount: Number(discount || 0),
        cash_received:
          paymentMethod === "cash" ? Number(cashReceived || 0) : null,
        customer_name: "Walk-in Customer",
      });

      setCartItems([]);
      setDiscount("0");
      setCashReceived("0");
      setCompletedReceipt(response.data.data);
      setPosMessage("Sale saved to the database and stock was updated.");
      await loadCatalog();
    } catch (error: any) {
      setPosError(error.response?.data?.message || "Unable to complete sale.");
    } finally {
      setIsSubmittingSale(false);
    }
  }

  if (isLoadingCatalog && products.length === 0) {
    return <PageLoadingState fullScreen label="Loading POS catalog..." />;
  }

  return (
    <main className="h-dvh overflow-hidden bg-paper-dim font-sans text-ink">
      <OwnerSidebar />

      <section className="h-dvh min-w-0 overflow-x-hidden overflow-y-auto lg:ml-72">
        <header className="dashboard-enter sticky top-0 z-30 border-b border-ink-line bg-paper-dim/95 py-3 pl-20 pr-4 shadow-md shadow-pine/10 backdrop-blur-xl sm:pr-6 lg:px-7 lg:py-5">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink-soft sm:text-sm">
                Point of Sale
              </p>
              <h1 className="truncate font-display text-xl font-bold text-pine sm:text-2xl lg:text-3xl">
                POS Dashboard
              </h1>
            </div>

            <label className="hidden h-14 min-w-0 items-center gap-3 rounded-xl border border-ink-line bg-white px-4 text-sm font-semibold text-ink-soft shadow-md shadow-pine/10 md:flex md:w-[18rem] xl:w-84">
              <Search size={19} />
              <input
                value={catalogSearch}
                onChange={(event) => setCatalogSearch(event.target.value)}
                className="w-full bg-transparent outline-none placeholder:text-ink-soft/70"
                placeholder="Search products, SKU,"
                type="search"
              />
            </label>

            <div className="hidden h-14 items-center rounded-xl border border-ink-line bg-white px-5 text-lg font-black text-pine shadow-md shadow-pine/10 sm:flex">
              {new Date().toLocaleTimeString("en-PH", {
                hour: "numeric",
                minute: "2-digit",
              })}
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-sm font-bold text-white sm:h-14 sm:w-12">
              {initial}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-5 lg:p-7">
          <div className="dashboard-enter min-h-[calc(100dvh-6rem)] space-y-4 rounded-xl bg-white p-3 shadow-[0_18px_45px_rgba(15,111,87,0.07)] sm:rounded-2xl sm:p-5 lg:min-h-[calc(100vh-10rem)]">
            {posError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {posError}
              </div>
            )}

            {posMessage && (
              <div className="rounded-xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf-dark">
                {posMessage}
              </div>
            )}

            <div className="grid items-stretch gap-4 lg:grid-cols-5">
              <CartCard
                cartItems={cartItems}
                onClear={() => setCartItems([])}
                onQuantityChange={updateCartQuantity}
                onRemove={removeCartItem}
                onUnitChange={updateCartUnit}
              />
              <CashierCard
                cashReceived={cashReceived}
                discount={discount}
                isSubmitting={isSubmittingSale}
                onCashReceivedChange={setCashReceived}
                onCompleteSale={completeSale}
                onDiscountChange={setDiscount}
                onPaymentMethodChange={setPaymentMethod}
                paymentMethod={paymentMethod}
                subtotal={subtotal}
                total={total}
              />
            </div>

            <ProductCatalog
              categories={categories}
              isLoading={isLoadingCatalog}
              onAddProduct={addProductToCart}
              onScanBarcode={() => setIsScannerOpen(true)}
              onSearchChange={setCatalogSearch}
              products={products}
              search={catalogSearch}
            />
          </div>
        </div>
      </section>

      {completedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine/45 p-3 backdrop-blur-sm">
          <div className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 text-center shadow-2xl sm:p-5">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-leaf/10 text-leaf-dark">
              <CheckCircle2 size={25} />
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold text-pine">
              Sale completed
            </h3>
            <p className="mt-1 font-mono text-xs font-bold text-ink-soft">
              {completedReceipt.receipt_number}
            </p>
            <div className="mt-5 rounded-xl bg-paper p-4 text-left text-sm">
              <div className="flex justify-between font-black">
                <span>Total paid</span>
                <span>{formatPeso(completedReceipt.total_amount)}</span>
              </div>
              {completedReceipt.change_due !== null && (
                <div className="mt-2 flex justify-between font-bold text-leaf-dark">
                  <span>Change</span>
                  <span>{formatPeso(completedReceipt.change_due)}</span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCompletedReceipt(null)}
              className="mt-5 h-11 w-full rounded-xl bg-leaf text-sm font-black text-white"
            >
              Start next sale
            </button>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(barcode) => void addScannedProduct(barcode)}
        title="Scan Product for POS"
      />
    </main>
  );
}

export default PosPage;
