import {
  AlertTriangle,
  Barcode,
  Boxes,
  ChevronDown,
  Filter,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ROUTES } from "../../../constants/routes";
import { STORAGE_KEYS } from "../../../constants/storage";
import api from "../../../services/api";
import {
  checkProductBarcode,
  generateAvailableBarcode,
  isSupportedBarcode,
  normalizeBarcode,
} from "../../../services/productService";
import { readJson } from "../../../utils/storage";
import BarcodeScannerModal from "../../../components/BarcodeScannerModal";
import OwnerSidebar from "../components/OwnerSidebar";
import { PageLoadingState } from "../../../components/LoadingSpinner";
import CompactMetricCard from "../components/CompactMetricCard";
import BarcodePreview from "../components/BarcodePreview";

type Product = {
  id: number;
  name: string;
  category: string;
  sku: string | null;
  barcode: string | null;
  image_url: string | null;
  unit_label: string;
  supplier: string | null;
  unit_price: number;
  cost_price: number;
  current_stock: number;
  reorder_level: number;
  track_stock: boolean;
  show_in_pos: boolean;
  status: "active" | "inactive";
  price_label: string;
  cost_label: string;
  stock_label: string;
  margin_label: string;
};

type ProductForm = {
  name: string;
  category: string;
  sku: string;
  barcode: string;
  image_url: string;
  unit_label: string;
  supplier: string;
  unit_price: string;
  cost_price: string;
  current_stock: string;
  reorder_level: string;
  status: "active" | "inactive";
  track_stock: boolean;
  show_in_pos: boolean;
};

const defaultCategories = [
  "Beverages",
  "Snacks",
  "Canned Goods",
  "Personal Care",
  "Staples",
  "Coffee",
  "Fresh Goods",
  "Household",
];

const emptyProductForm: ProductForm = {
  name: "",
  category: "",
  sku: "",
  barcode: "",
  image_url: "",
  unit_label: "",
  supplier: "",
  unit_price: "",
  cost_price: "",
  current_stock: "",
  reorder_level: "",
  status: "active",
  track_stock: true,
  show_in_pos: true,
};

function ProductsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState("");
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [productForm, setProductForm] =
    useState<ProductForm>(emptyProductForm);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isGeneratingBarcode, setIsGeneratingBarcode] = useState(false);
  const [productError, setProductError] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const user = readJson<{ name?: string; email?: string }>(STORAGE_KEYS.user);
  const ownerName = user?.name || "Owner";
  const initial = ownerName.charAt(0).toUpperCase();
  const productCategories = useMemo(
    () => Array.from(new Set([...defaultCategories, ...categories])).sort(),
    [categories],
  );
  const lowStockCount = products.filter(
    (product) => product.current_stock <= product.reorder_level,
  ).length;
  const totalInventoryUnits = products.reduce(
    (total, product) => total + product.current_stock,
    0,
  );
  const productStats = [
    {
      label: "Total products",
      value: products.length.toString(),
      caption: isLoadingProducts ? "Loading catalog" : "Database catalog items",
      icon: Package,
    },
    {
      label: "Low stock",
      value: lowStockCount.toString(),
      caption: "Needs restock",
      icon: AlertTriangle,
    },
    {
      label: "Inventory units",
      value: totalInventoryUnits.toString(),
      caption: "Available stock",
      icon: Boxes,
    },
    {
      label: "Categories",
      value: categories.length.toString(),
      caption: "Product groups",
      icon: SlidersHorizontal,
    },
  ];
  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !term ||
        `${product.name} ${product.sku || ""} ${product.supplier || ""}`
          .toLowerCase()
          .includes(term);
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      const matchesStock =
        !lowStockOnly || product.current_stock <= product.reorder_level;
      const matchesStatus =
        statusFilter === "all" || product.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStock && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, lowStockOnly, statusFilter]);

  async function loadProducts() {
    try {
      setIsLoadingProducts(true);
      setProductError("");

      const response = await api.get("/products");
      const data = response.data.data;

      setProducts(data.products || []);
      setCategories(data.categories?.length ? data.categories : defaultCategories);
    } catch (error: any) {
      setProductError(
        error.response?.data?.message ||
          "Unable to load products from the database.",
      );
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (searchParams.get("add") === "1") {
      setEditingProductId(null);
      setProductForm(emptyProductForm);
      setIsBarcodeScannerOpen(false);
      setScannedBarcode("");
      setIsAddProductOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  function updateProductForm(
    field: keyof ProductForm,
    value: string | boolean,
  ) {
    setProductForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function readProductImage(file: File | undefined) {
    if (!file) return;

    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
    if (!allowedTypes.has(file.type)) {
      setProductError("Choose a PNG, JPEG, or WebP product image.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProductError("Product image must be 2 MB or smaller.");
      return;
    }

    setProductError("");

    const reader = new FileReader();

    reader.onload = () => {
      updateProductForm("image_url", String(reader.result || ""));
    };

    reader.readAsDataURL(file);
  }

  async function handleCreateProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setProductError("");
    setProductSuccess("");

    if (!productForm.name.trim()) {
      setProductError("Product name is required.");
      return;
    }

    try {
      setIsSavingProduct(true);

      const barcode = normalizeBarcode(productForm.barcode);
      if (!isSupportedBarcode(barcode)) {
        setProductError("Barcode contains unsupported characters.");
        return;
      }

      if (barcode) {
        const barcodeCheck = await checkProductBarcode(barcode);
        if (
          barcodeCheck.exists &&
          barcodeCheck.product_id !== editingProductId
        ) {
          setProductError(
            "This barcode is already assigned to another product.",
          );
          return;
        }
      }

      const payload = {
        name: productForm.name.trim(),
        category: productForm.category.trim(),
        sku: productForm.sku.trim(),
        barcode,
        image_url: productForm.image_url,
        unit_label: productForm.unit_label.trim() || "Piece",
        supplier: productForm.supplier.trim(),
        unit_price: Number(productForm.unit_price || 0),
        cost_price: Number(productForm.cost_price || 0),
        current_stock: Number(productForm.current_stock || 0),
        reorder_level: Number(productForm.reorder_level || 0),
        status: productForm.status,
        track_stock: productForm.track_stock,
        show_in_pos: productForm.show_in_pos,
      };

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload);
      } else {
        await api.post("/products", payload);
      }

      setProductForm(emptyProductForm);
      setIsBarcodeScannerOpen(false);
      setScannedBarcode("");
      setProductSuccess(
        editingProductId
          ? "Product updated in the database."
          : "Product saved to the database.",
      );
      setIsAddProductOpen(false);
      setEditingProductId(null);
      await loadProducts();
    } catch (error: any) {
      setProductError(
        error.response?.data?.message || "Unable to save product.",
      );
    } finally {
      setIsSavingProduct(false);
    }
  }

  function openAddProduct() {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setIsBarcodeScannerOpen(false);
    setScannedBarcode("");
    setIsAddProductOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductForm({
      name: product.name,
      category: product.category,
      sku: product.sku || "",
      barcode: product.barcode || "",
      image_url: product.image_url || "",
      unit_label: product.unit_label,
      supplier: product.supplier || "",
      unit_price: String(product.unit_price),
      cost_price: String(product.cost_price),
      current_stock: String(product.current_stock),
      reorder_level: String(product.reorder_level),
      status: product.status,
      track_stock: product.track_stock,
      show_in_pos: product.show_in_pos,
    });
    setIsBarcodeScannerOpen(false);
    setScannedBarcode("");
    setIsAddProductOpen(true);
  }

  function openProductStockIn(product: Product) {
    navigate(
      `${ROUTES.ownerInventory}?stock-in=1&product_id=${product.id}`,
    );
  }

  const handleBarcodeDetected = useCallback((code: string) => {
    const barcode = normalizeBarcode(code);
    setProductForm((currentForm) => ({
      ...currentForm,
      barcode,
    }));
    setScannedBarcode(barcode);
    setProductError("");
    setProductSuccess(`Barcode ${barcode} scanned successfully.`);
    setIsBarcodeScannerOpen(false);
  }, []);

  async function generateBarcode() {
    try {
      setIsGeneratingBarcode(true);
      setProductError("");
      const barcode = await generateAvailableBarcode();
      updateProductForm("barcode", barcode);
      setScannedBarcode(barcode);
      setProductSuccess(`Barcode ${barcode} generated successfully.`);
    } catch (error: any) {
      setProductError(
        error.response?.data?.message ||
          error.message ||
          "Unable to generate barcode.",
      );
    } finally {
      setIsGeneratingBarcode(false);
    }
  }

  async function removeProduct(product: Product) {
    if (
      !window.confirm(
        `Delete ${product.name}? Products with sales history should be set inactive instead.`,
      )
    ) {
      return;
    }

    try {
      setProductError("");
      await api.delete(`/products/${product.id}`);
      setSelectedProductIds((ids) => ids.filter((id) => id !== product.id));
      setProductSuccess(`${product.name} was deleted.`);
      await loadProducts();
    } catch (error: any) {
      setProductError(
        error.response?.data?.message || "Unable to delete product.",
      );
    }
  }

  if (isLoadingProducts && products.length === 0) {
    return <PageLoadingState fullScreen label="Loading product catalog..." />;
  }

  return (
    <main className="h-dvh overflow-hidden bg-paper-dim font-sans text-ink">
      <OwnerSidebar />

      <section className="h-dvh min-w-0 overflow-x-hidden overflow-y-auto lg:ml-72">
        <header className="dashboard-enter sticky top-0 z-30 border-b border-ink-line bg-paper-dim/95 py-3 pl-20 pr-4 shadow-md shadow-pine/10 backdrop-blur-xl sm:pr-6 lg:px-7 lg:py-5">
          <div className="flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-ink-soft sm:text-sm">Inventory</p>
              <h1 className="font-display text-xl font-bold text-pine sm:text-2xl lg:text-3xl">
                Products
              </h1>
            </div>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-sm font-bold text-white sm:h-12 sm:w-12">
              {initial}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-5 lg:p-7">
          <section className="dashboard-enter rounded-xl bg-white p-4 shadow-[0_18px_45px_rgba(15,111,87,0.07)] sm:rounded-2xl sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-leaf/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-leaf-dark">
                  <Package size={14} />
                  Product catalog
                </div>
                <h2 className="mt-2 font-display text-2xl font-bold text-pine sm:text-3xl">
                  Manage Products
                </h2>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  Search, filter, restock, and maintain items used by the POS.
                </p>
              </div>
              <button
                type="button"
                onClick={openAddProduct}
                className="flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-leaf px-4 text-sm font-black text-white shadow-lg shadow-leaf/20 transition hover:bg-leaf-dark sm:mt-8 sm:w-fit"
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {productStats.map(({ label, value, caption, icon: Icon }) => (
                <CompactMetricCard
                  key={label}
                  detail={caption}
                  icon={Icon}
                  label={label}
                  tone={label === "Low stock" ? "amber" : "leaf"}
                  value={value}
                />
              ))}
            </div>

            {productError && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
                {productError}
              </div>
            )}

            {productSuccess && (
              <div className="mt-5 rounded-xl border border-leaf/20 bg-leaf/10 px-4 py-3 text-sm font-bold text-leaf-dark">
                {productSuccess}
              </div>
            )}

            <div className="mt-5">
              <div className="min-w-0">
                <div className="overflow-hidden rounded-2xl border border-ink-line">
                  <div className="border-b border-ink-line bg-white p-4">
                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem]">
                      <label className="flex h-11 min-w-0 items-center gap-3 rounded-xl border border-ink-line bg-white px-4 text-sm font-semibold text-ink-soft shadow-sm">
                        <Search size={17} />
                        <input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          className="w-full bg-transparent outline-none placeholder:text-ink-soft/70"
                          placeholder="Search product name, SKU, supplier"
                          type="search"
                        />
                      </label>

                      <label className="relative flex h-11 items-center gap-2 rounded-xl border border-ink-line bg-white px-4 text-sm font-black text-ink transition hover:border-leaf/40 hover:text-pine">
                        <Filter size={17} />
                        <select
                          className="h-full w-full appearance-none bg-transparent pr-5 outline-none"
                          value={selectedCategory}
                          onChange={(event) =>
                            setSelectedCategory(event.target.value)
                          }
                          aria-label="Filter by category"
                        >
                          {["All", ...productCategories].map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          className="pointer-events-none absolute right-3 text-ink-soft"
                          size={16}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setLowStockOnly((value) => !value)}
                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black transition ${lowStockOnly ? "border-amber bg-amber/10 text-amber" : "border-ink-line bg-white text-ink hover:border-leaf/40 hover:text-pine"}`}
                      >
                        <AlertTriangle size={17} />
                        Stock
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setStatusFilter((value) =>
                            value === "all"
                              ? "active"
                              : value === "active"
                                ? "inactive"
                                : "all",
                          )
                        }
                        className={`flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-black capitalize transition ${statusFilter !== "all" ? "border-leaf/40 bg-leaf/5 text-pine" : "border-ink-line bg-white text-ink hover:border-leaf/40"}`}
                      >
                        <SlidersHorizontal size={17} />
                        {statusFilter === "all" ? "All status" : statusFilter}
                      </button>
                    </div>
                  </div>

                  <div className="divide-y divide-ink-line md:hidden">
                    {isLoadingProducts && (
                      <div className="bg-white px-4 py-8 text-center text-sm font-bold text-ink-soft">
                        Loading products from database...
                      </div>
                    )}

                    {!isLoadingProducts && filteredProducts.length === 0 && (
                      <div className="bg-white px-4 py-8 text-center text-sm font-bold text-ink-soft">
                        No products found. Add a product or adjust the filters.
                      </div>
                    )}

                    {!isLoadingProducts && filteredProducts.map((product) => (
                      <article key={product.id} className="bg-white p-4">
                        <div className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-3">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-ink-line bg-paper text-leaf-dark">
                            {product.image_url ? (
                              <img alt="" className="h-full w-full object-cover" src={product.image_url} />
                            ) : (
                              <Package size={18} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-ink">{product.name}</p>
                            <p className="mt-1 truncate font-mono text-[0.68rem] text-ink-soft">
                              {product.sku || "No SKU"} · {product.unit_label}
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              <span className="rounded-md bg-paper-dim px-2 py-1 text-[0.65rem] font-black text-ink-soft">
                                {product.category}
                              </span>
                              <span className={`rounded-md px-2 py-1 text-[0.65rem] font-black ${product.status === "active" ? "bg-leaf/10 text-leaf-dark" : "bg-slate-100 text-slate-500"}`}>
                                {product.status}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button type="button" onClick={() => openEditProduct(product)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-line text-ink-soft" aria-label={`Edit ${product.name}`}>
                              <Pencil size={15} />
                            </button>
                            <button type="button" onClick={() => removeProduct(product)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-line text-red-500" aria-label={`Delete ${product.name}`}>
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-paper p-3">
                          <div>
                            <p className="text-[0.65rem] font-black uppercase text-ink-soft">Selling price</p>
                            <p className="mt-1 text-sm font-black text-pine">{product.price_label}</p>
                          </div>
                          <div>
                            <p className="text-[0.65rem] font-black uppercase text-ink-soft">Stock</p>
                            <p className={`mt-1 text-sm font-black ${product.current_stock <= product.reorder_level ? "text-red-500" : "text-leaf-dark"}`}>
                              {product.current_stock} {product.unit_label}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openProductStockIn(product)}
                          className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border text-xs font-black transition ${
                            product.current_stock <= product.reorder_level
                              ? "border-amber bg-amber/10 text-amber hover:bg-amber/15"
                              : "border-leaf/35 bg-leaf/5 text-leaf-dark hover:bg-leaf/10"
                          }`}
                        >
                          <PackagePlus size={16} />
                          Stock In This Product
                        </button>
                      </article>
                    ))}
                  </div>

                  <div className="hidden overflow-x-auto md:block">
                    <div className="min-w-[1120px]">
                      <div className="grid grid-cols-[3rem_5.5rem_minmax(0,1.7fr)_8.5rem_7rem_7rem_7rem_7rem_8rem_7rem] bg-paper-dim/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-ink-soft">
                        <span>
                          <input
                            aria-label="Select all products"
                            className="h-4 w-4 rounded border-ink-line accent-leaf"
                            type="checkbox"
                            checked={
                              filteredProducts.length > 0 &&
                              filteredProducts.every((product) =>
                                selectedProductIds.includes(product.id),
                              )
                            }
                            onChange={(event) =>
                              setSelectedProductIds(
                                event.target.checked
                                  ? filteredProducts.map(
                                      (product) => product.id,
                                    )
                                  : [],
                              )
                            }
                          />
                        </span>
                        <span>Image</span>
                        <span>Product</span>
                        <span>Category</span>
                        <span>Price</span>
                        <span>Cost</span>
                        <span>Stock</span>
                        <span>Margin</span>
                        <span>Status</span>
                        <span className="text-right">Action</span>
                      </div>

                      {isLoadingProducts && (
                        <div className="border-t border-ink-line bg-white px-4 py-8 text-center text-sm font-bold text-ink-soft">
                          Loading products from database...
                        </div>
                      )}

                      {!isLoadingProducts && filteredProducts.length === 0 && (
                        <div className="border-t border-ink-line bg-white px-4 py-8 text-center text-sm font-bold text-ink-soft">
                          No products yet. Add your first product to test real
                          database data.
                        </div>
                      )}

                      {!isLoadingProducts && filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="grid grid-cols-[3rem_5.5rem_minmax(0,1.7fr)_8.5rem_7rem_7rem_7rem_7rem_8rem_7rem] items-center border-t border-ink-line bg-white px-4 py-3 text-sm transition hover:bg-paper"
                        >
                          <span>
                            <input
                              aria-label={`Select ${product.name}`}
                              className="h-4 w-4 rounded border-ink-line accent-leaf"
                              type="checkbox"
                              checked={selectedProductIds.includes(product.id)}
                              onChange={(event) =>
                                setSelectedProductIds((ids) =>
                                  event.target.checked
                                    ? [...new Set([...ids, product.id])]
                                    : ids.filter((id) => id !== product.id),
                                )
                              }
                            />
                          </span>
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-ink-line bg-paper text-leaf-dark">
                            {product.image_url ? (
                              <img
                                alt=""
                                className="h-full w-full rounded-xl object-cover"
                                src={product.image_url}
                              />
                            ) : (
                              <Package size={18} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-black text-ink">
                              {product.name}
                            </p>
                            <p className="mt-0.5 truncate font-mono text-xs text-ink-soft">
                              {product.sku || "No SKU"} · {product.unit_label} ·{" "}
                              {product.supplier || "No supplier"}
                            </p>
                          </div>

                          <span className="truncate text-xs font-bold text-ink-soft">
                            {product.category}
                          </span>
                          <span className="font-black text-ink">
                            {product.price_label}
                          </span>
                          <span className="text-xs font-bold text-ink-soft">
                            {product.cost_label}
                          </span>
                          <div>
                            <span
                              className={`w-fit rounded-md px-2 py-1 text-xs font-black ${
                                product.current_stock <= product.reorder_level
                                  ? "bg-red-100 text-red-500"
                                  : "bg-leaf/10 text-leaf-dark"
                              }`}
                            >
                              {product.current_stock} left
                            </span>
                            <p className="mt-1 text-[0.68rem] font-bold text-ink-soft">
                              Reorder {product.reorder_level}
                            </p>
                          </div>
                          <span className="font-black text-pine">
                            {product.margin_label}
                          </span>
                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                              product.status === "active"
                                ? "bg-leaf/10 text-leaf-dark"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {product.status}
                          </span>
                          <div className="ml-auto flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openProductStockIn(product)}
                              className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                                product.current_stock <= product.reorder_level
                                  ? "border-amber/50 bg-amber/10 text-amber hover:bg-amber/20"
                                  : "border-leaf/30 text-leaf-dark hover:bg-leaf/10"
                              }`}
                              aria-label={`Stock in ${product.name}`}
                              title={`Stock in ${product.name}`}
                            >
                              <PackagePlus size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditProduct(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-line text-ink-soft transition hover:border-leaf/40 hover:text-pine"
                              aria-label={`Edit ${product.name}`}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeProduct(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-line text-ink-soft transition hover:border-leaf/40 hover:text-pine"
                              aria-label={`Delete ${product.name}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pine/45 p-3 backdrop-blur-sm sm:px-4 sm:py-6">
          <div className="scrollbar-hidden max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink-line bg-white p-4 shadow-[0_28px_80px_rgba(15,111,87,0.28)] sm:max-h-[92vh] sm:rounded-3xl sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-leaf/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-leaf-dark">
                  New product
                </div>
                <h3 className="mt-2 font-display text-2xl font-bold text-pine sm:text-3xl">
                  {editingProductId ? "Edit Product" : "Add Product"}
                </h3>
                <p className="mt-1 text-sm font-medium text-ink-soft">
                  Add the basic product details used by POS and inventory.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddProductOpen(false);
                  setEditingProductId(null);
                  setIsBarcodeScannerOpen(false);
                  setScannedBarcode("");
                }}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ink-line text-ink-soft transition hover:border-leaf/40 hover:text-pine"
                aria-label="Close add product form"
              >
                <X size={18} />
              </button>
            </div>

            <form className="mt-5 space-y-5" onSubmit={handleCreateProduct}>
              <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-leaf/35 bg-paper p-5 text-center transition hover:bg-leaf/5">
                {productForm.image_url && (
                  <img
                    alt=""
                    className="mb-3 h-24 w-24 rounded-2xl object-cover"
                    src={productForm.image_url}
                  />
                )}
                <span className="text-sm font-black text-pine">
                  {productForm.image_url
                    ? "Change product image"
                    : "Import product image"}
                </span>
                <span className="mt-1 text-xs font-bold text-ink-soft">
                  PNG, JPG, or WebP up to 2 MB.
                </span>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => readProductImage(event.target.files?.[0])}
                  type="file"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wide text-ink-soft">
                    Product name
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-ink-line px-4 text-sm font-semibold outline-none transition focus:border-leaf/50"
                    onChange={(event) =>
                      updateProductForm("name", event.target.value)
                    }
                    placeholder="Example: Rice per kilo"
                    required
                    type="text"
                    value={productForm.name}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wide text-ink-soft">
                    Category
                  </span>
                  <div className="relative">
                    <select
                      className="h-12 w-full appearance-none rounded-xl border border-ink-line bg-white px-4 pr-10 text-sm font-semibold outline-none transition focus:border-leaf/50"
                      onChange={(event) =>
                        updateProductForm("category", event.target.value)
                      }
                      required
                      value={productForm.category}
                    >
                      <option disabled value="">
                        Select category
                      </option>
                      {productCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft"
                      size={17}
                    />
                  </div>
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wide text-ink-soft">
                    Selling price
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-ink-line px-4 text-sm font-semibold outline-none transition focus:border-leaf/50"
                    onChange={(event) =>
                      updateProductForm("unit_price", event.target.value)
                    }
                    placeholder="₱0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={productForm.unit_price}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wide text-ink-soft">
                    Stock quantity
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-ink-line px-4 text-sm font-semibold outline-none transition focus:border-leaf/50"
                    onChange={(event) =>
                      updateProductForm("current_stock", event.target.value)
                    }
                    placeholder="0"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={productForm.current_stock}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wide text-ink-soft">
                    Unit
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-ink-line px-4 text-sm font-semibold outline-none transition focus:border-leaf/50"
                    onChange={(event) =>
                      updateProductForm("unit_label", event.target.value)
                    }
                    placeholder="Example: Piece, pack, bottle, kilo"
                    required
                    type="text"
                    value={productForm.unit_label}
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-black uppercase tracking-wide text-ink-soft">
                    SKU
                  </span>
                  <input
                    className="h-12 w-full rounded-xl border border-ink-line px-4 text-sm font-semibold outline-none transition focus:border-leaf/50"
                    onChange={(event) =>
                      updateProductForm("sku", event.target.value)
                    }
                    placeholder="Example: RICE-001"
                    type="text"
                    value={productForm.sku}
                  />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-xs font-black uppercase tracking-wide text-ink-soft">
                    Barcode
                  </span>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-xl border border-ink-line bg-white px-3 focus-within:border-leaf/50">
                      <Barcode className="shrink-0 text-leaf-dark" size={17} />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none"
                        onChange={(event) => {
                          updateProductForm("barcode", event.target.value);
                          setScannedBarcode("");
                        }}
                        placeholder="4800012345678"
                        type="text"
                        value={productForm.barcode}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsBarcodeScannerOpen(true)}
                      className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-leaf/35 bg-leaf/5 px-4 text-sm font-black text-leaf-dark transition hover:bg-leaf/10"
                    >
                      <Barcode size={18} />
                      Scan
                    </button>
                    <button
                      type="button"
                      disabled={isGeneratingBarcode}
                      onClick={generateBarcode}
                      className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-ink-line bg-white px-4 text-sm font-black text-pine transition hover:border-leaf/40 disabled:opacity-50"
                    >
                      <WandSparkles size={17} />
                      {isGeneratingBarcode ? "Generating" : "Generate"}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-ink-soft">
                    Optional. Scan, generate, or enter a product barcode.
                  </p>
                </label>

                {scannedBarcode && (
                  <div className="md:col-span-2 rounded-2xl border border-leaf/30 bg-leaf/5 p-4">
                    <div className="mb-3 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-wide text-leaf-dark">
                          Barcode ready
                        </p>
                        <p className="mt-1 truncate text-sm font-black text-ink">
                          {scannedBarcode}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateProductForm("barcode", "");
                          setScannedBarcode("");
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ink-line bg-white text-ink-soft transition hover:border-leaf/40 hover:text-pine"
                        aria-label="Clear captured barcode"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    <BarcodePreview value={scannedBarcode} />
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddProductOpen(false);
                    setEditingProductId(null);
                    setIsBarcodeScannerOpen(false);
                    setScannedBarcode("");
                  }}
                  className="flex h-11 items-center justify-center rounded-xl border border-ink-line px-4 text-sm font-black text-ink transition hover:border-leaf/40 hover:text-pine"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl bg-leaf px-5 text-sm font-black text-white shadow-lg shadow-leaf/20 transition hover:bg-leaf-dark"
                >
                  {isSavingProduct
                    ? "Saving..."
                    : editingProductId
                      ? "Update Product"
                      : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScan={handleBarcodeDetected}
        title="Scan Product Barcode"
      />

    </main>
  );
}

export default ProductsPage;
