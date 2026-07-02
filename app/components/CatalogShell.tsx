"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  formatCurrency,
  formatRating,
  getDiscountPercent,
} from "../lib/format";
import { useDebounce } from "../lib/useDebounce";
import { captureEvent } from "../lib/analytics";

type CatalogShellProps = {
  initialProducts: any[];
  initialTotal: number;
  initialTotalPages: number;
  filters: any;
  allProducts: any[];
};

export default function CatalogShell({
  initialProducts,
  initialTotal,
  initialTotalPages,
  filters,
  allProducts,
}: CatalogShellProps) {
  const router = useRouter();
  const browserParams =
    typeof window === "undefined"
      ? new URLSearchParams()
      : new URLSearchParams(window.location.search);
  const savedColumns =
    typeof window === "undefined"
      ? 4
      : Number(
          window.localStorage.getItem("catalogColumns") ||
            (window.innerWidth > 1180 ? 5 : 2),
        );

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [searchText, setSearchText] = useState(browserParams.get("q") || "");
  const [query, setQuery] = useState(browserParams.get("q") || "");
  const [category, setCategory] = useState(browserParams.get("category") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    browserParams.get("category") || "",
  );
  const [brand, setBrand] = useState(browserParams.get("brand") || "");
  const [minPrice, setMinPrice] = useState(browserParams.get("min") || "");
  const [maxPrice, setMaxPrice] = useState(browserParams.get("max") || "");
  const [sort, setSort] = useState(browserParams.get("sort") || "popular");
  const [page, setPage] = useState(Number(browserParams.get("page") || 1));
  const [pageSize, setPageSize] = useState(24);
  const [columns, setColumns] = useState(savedColumns);
  const [viewMode, setViewMode] = useState("grid");
  const [loading, setLoading] = useState(false);
  const [requestLabel, setRequestLabel] = useState("initial");
  const [cartCount, setCartCount] = useState(0);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [lastServerTime, setLastServerTime] = useState("");
  const [lastRequestKey, setLastRequestKey] = useState("");
  const [shouldPreserveFiltersInUrl, setShouldPreserveFiltersInUrl] =
    useState(false);

  const debouncedSearch = useDebounce((value: string) => {
    setQuery(value);
    setPage(1);
  }, 650);

  function captureCatalogEvent(
    event: string,
    payload: Record<string, any> = {},
  ) {
    if (!analyticsEnabled) {
      return;
    }

    captureEvent(event, {
      ...payload,
      query,
      category: selectedCategory || category,
      brand,
      minPrice,
      maxPrice,
      sort,
      page,
      pageSize,
    });
  }

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLElement>,
    productId: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      router.push(`/products/${productId}`);
    }
  }

  const priceBand = useMemo(
    () =>
      products.reduce(
        (summary: any, product: any) => {
          summary.low = Math.min(summary.low, product.price);
          summary.high = Math.max(summary.high, product.price);
          summary.average += product.price / Math.max(1, products.length);
          return summary;
        },
        { low: Number.MAX_SAFE_INTEGER, high: 0, average: 0 },
      ),
    [products],
  );

  const expensiveMerchandisingList = allProducts
    .map((product: any) => {
      let score = 0;
      const text = `${product.name}${product.description}${product.category}${product.brand}`;
      for (let i = 0; i < text.length; i += 1) {
        score += text.charCodeAt(i) % 11;
      }

      return {
        ...product,
        score: score + product.popularity + (product.freeShipping ? 400 : 0),
      };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  function buildCatalogHref(includeFilters: boolean) {
    if (typeof window === "undefined") {
      return "/";
    }

    const params = new URLSearchParams(window.location.search);
    ["q", "category", "brand", "min", "max", "sort", "page"].forEach((key) =>
      params.delete(key),
    );

    if (query) params.set("q", query);
    if (page > 1) params.set("page", String(page));

    if (includeFilters) {
      if (selectedCategory || category) {
        params.set("category", selectedCategory || category);
      }
      if (brand) params.set("brand", brand);
      if (minPrice) params.set("min", minPrice);
      if (maxPrice) params.set("max", maxPrice);
      if (sort !== "popular") params.set("sort", sort);
    }

    const nextSearch = params.toString();
    return `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ""}`;
  }

  async function loadProducts(
    reason: string,
    pageOverride = page,
    qOverride = searchText,
  ) {
    setLoading(true);
    setRequestLabel(reason);

    const params = new URLSearchParams({
      q: qOverride,
      category: selectedCategory || category,
      brand,
      min: minPrice,
      max: maxPrice,
      sort,
      page: String(pageOverride),
      pageSize: String(pageSize),
    });
    const requestKey = params.toString();
    setLastRequestKey(requestKey);

    // FIXME: callers do not cancel this request, so slower responses can replace newer searches.
    const response = await fetch(`/api/products?${requestKey}`);
    const data: any = await response.json();

    setProducts(data.items);
    setTotal(data.total);
    setTotalPages(data.totalPages);
    setLastServerTime(data.serverTime);
    setLoading(false);

    captureCatalogEvent("catalog-fetch", {
      reason,
      requestKey,
      resultCount: data.total,
      query: qOverride,
      page: pageOverride,
    });
  }

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const catalogKeys = [
      "q",
      "category",
      "brand",
      "min",
      "max",
      "sort",
      "page",
    ];
    const hasCatalogParams = catalogKeys.some((key) => params.has(key));
    const hasExternalParams = Array.from(params.keys()).some(
      (key) => !catalogKeys.includes(key),
    );

    if (hasCatalogParams) {
      setSearchText(params.get("q") || "");
      setQuery(params.get("q") || "");
      setCategory(params.get("category") || "");
      setSelectedCategory(params.get("category") || "");
      setBrand(params.get("brand") || "");
      setMinPrice(params.get("min") || "");
      setMaxPrice(params.get("max") || "");
      setSort(params.get("sort") || "popular");
      setPage(Number(params.get("page") || 1));
      setShouldPreserveFiltersInUrl(
        Boolean(
          params.get("category") ||
          params.get("brand") ||
          params.get("min") ||
          params.get("max") ||
          params.get("sort"),
        ),
      );
      return;
    }

    if (hasExternalParams) {
      return;
    }

    const savedFilters = window.localStorage.getItem("snapshop-filters");
    if (savedFilters) {
      const parsed: any = JSON.parse(savedFilters);
      setSearchText(parsed.query || parsed.q || "");
      setQuery(parsed.query || parsed.q || "");
      setCategory(parsed.category || "");
      setSelectedCategory(parsed.selectedCategory || parsed.category || "");
      setBrand(parsed.brand || "");
      setMinPrice(parsed.minPrice || "");
      setMaxPrice(parsed.maxPrice || "");
      setSort(parsed.sort || "popular");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextHref = buildCatalogHref(shouldPreserveFiltersInUrl);
    const currentHref = `${window.location.pathname}${window.location.search}`;
    if (currentHref !== nextHref) {
      router.replace(nextHref, {
        scroll: false,
      });
    }
  }, [
    query,
    selectedCategory,
    category,
    brand,
    minPrice,
    maxPrice,
    sort,
    page,
    shouldPreserveFiltersInUrl,
    router,
  ]);

  useEffect(() => {
    window.localStorage.setItem(
      "snapshop-filters",
      JSON.stringify({
        query,
        category,
        selectedCategory,
        brand,
        sort,
        minPrice,
        maxPrice,
      }),
    );
  });

  useEffect(() => {
    loadProducts("search-change", page, query);

    if (analyticsEnabled) {
      fetch(
        `/api/products?q=${encodeURIComponent(query)}&page=1&pageSize=12`,
      ).catch(() => undefined);
    }
  }, [
    query,
    selectedCategory,
    brand,
    sort,
    page,
    pageSize,
    viewMode,
    analyticsEnabled,
  ]);

  useEffect(() => {
    if (!analyticsEnabled) {
      return;
    }

    captureCatalogEvent("catalog-impressions", {
      productIds: products.map((item) => item.id),
      resultCount: products.length,
    });
  }, [products, analyticsEnabled]);

  function onSearchChange(value: string) {
    setSearchText(value);
    setPage(1);
    if (analyticsEnabled) {
      captureCatalogEvent("search-term", { query: value });
    }
    debouncedSearch(value);
  }

  function clearFilters() {
    if (analyticsEnabled) {
      captureCatalogEvent("clear-filters", {
        previousQuery: searchText,
        previousCategory: category,
        previousBrand: brand,
        previousSort: sort,
      });
    }

    debouncedSearch.cancel();
    setSearchText("");
    setQuery("");
    setCategory("");
    setSelectedCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("popular");
    setPage(1);
    setShouldPreserveFiltersInUrl(false);
  }

  function changePage(nextPage: number) {
    if (analyticsEnabled) {
      captureCatalogEvent("pagination-click", { nextPage });
    }

    setPage(Math.max(1, Math.min(totalPages, nextPage)));
    loadProducts("pagination-click", nextPage, query);
  }

  function addToCart(product: any) {
    setCartCount(cartCount + 1);
    window.localStorage.setItem("lastAddedProduct", product.id);
  }

  return (
    <main className="shop-page">
      <header className="topbar">
        <div>
          <p className="eyebrow">Snapshop Marketplace</p>
          <h1>Product Catalog</h1>
        </div>
        <div className="topbar-actions">
          <div className="cart-pill" aria-live="polite">
            Cart {cartCount}
          </div>
          <div
            className="status-pill"
            suppressHydrationWarning
            aria-live="polite"
          >
            Updated {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      <section className="catalog-toolbar">
        <div className="search-box">
          <input
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label="Search products"
            placeholder="Search 5,000 products"
          />
          <button
            type="button"
            onClick={() => {
              debouncedSearch.cancel();
              const nextQuery = searchText;
              if (query === nextQuery) {
                loadProducts("manual-search", 1, nextQuery);
                return;
              }
              setQuery(nextQuery);
              setPage(1);
            }}
          >
            Search
          </button>
        </div>
        <div className="toolbar-controls">
          <select
            aria-label="Sort products"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="popular">Popular</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
            <option value="rating">Top rated</option>
            <option value="newest">Newest</option>
          </select>
          <select
            aria-label="Products per page"
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
          >
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={48}>48 per page</option>
          </select>
          <button
            type="button"
            className={viewMode === "grid" ? "active" : ""}
            onClick={() => {
              setViewMode("grid");
              captureEvent("view-mode-change", { viewMode: "grid" });
            }}
          >
            Grid
          </button>
          <button
            type="button"
            className={viewMode === "list" ? "active" : ""}
            onClick={() => {
              setViewMode("list");
              captureEvent("view-mode-change", { viewMode: "list" });
            }}
          >
            List
          </button>
        </div>
      </section>

      <section className="summary-strip">
        <div>
          <strong>{total.toLocaleString()}</strong>
          <span>results</span>
        </div>
        <div>
          <strong>{formatCurrency(priceBand.average || 0)}</strong>
          <span>avg price</span>
        </div>
        <div>
          <strong>
            {formatCurrency(
              priceBand.low === Number.MAX_SAFE_INTEGER ? 0 : priceBand.low,
            )}
          </strong>
          <span>lowest</span>
        </div>
        <div>
          <strong>{loading ? "Syncing" : "Ready"}</strong>
          <span>{requestLabel}</span>
        </div>
      </section>

      <div className="catalog-layout">
        <FilterPanel
          filters={filters}
          category={category}
          setCategory={setCategory}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          brand={brand}
          setBrand={setBrand}
          minPrice={minPrice}
          setMinPrice={setMinPrice}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          clearFilters={clearFilters}
          loadProducts={loadProducts}
          analyticsEnabled={analyticsEnabled}
          setAnalyticsEnabled={setAnalyticsEnabled}
          columns={columns}
          setColumns={setColumns}
        />

        <section className="products-panel">
          <div className="panel-heading">
            <div>
              <h2>Recommended for today</h2>
              <p>
                Showing page {page} of {totalPages}. Last server update{" "}
                {lastServerTime || "not synced"}. Request{" "}
                {lastRequestKey || "initial"}.
              </p>
            </div>
            {loading ? (
              <span className="loading-dot" aria-live="polite">
                Loading
              </span>
            ) : null}
          </div>

          <div className="merch-row">
            {expensiveMerchandisingList.map((product: any) => (
              <button
                key={product.id}
                type="button"
                className="mini-product"
                onClick={() => router.push(`/products/${product.id}`)}
                aria-label={`View ${product.name}`}
              >
                <span style={{ background: product.color }} />
                <p>{product.name}</p>
              </button>
            ))}
          </div>

          <div
            className={viewMode === "grid" ? "product-grid" : "product-list"}
            style={{ "--columns": columns } as any}
          >
            {products.map((product: any, index: number) => (
              <ProductCard
                key={`${product.id}-${index}`}
                product={product}
                addToCart={addToCart}
                router={router}
                viewMode={viewMode}
                query={query}
                category={category}
                selectedCategory={selectedCategory}
                brand={brand}
                setBrand={setBrand}
                setCategory={setCategory}
                setSelectedCategory={setSelectedCategory}
                page={page}
                setPage={setPage}
                loadProducts={loadProducts}
                onCardKeyDown={handleCardKeyDown}
              />
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            changePage={changePage}
          />
        </section>
      </div>
    </main>
  );
}

function FilterPanel(props: any) {
  return (
    <aside className="filter-panel">
      <div className="filter-heading">
        <h2>Filters</h2>
        <button type="button" onClick={props.clearFilters}>
          Reset
        </button>
      </div>

      <div className="filter-group">
        <label htmlFor="category-filter">Category</label>
        <select
          id="category-filter"
          value={props.selectedCategory || props.category}
          onChange={(event) => {
            const nextCategory = event.target.value;
            props.setCategory(nextCategory);
            props.setSelectedCategory(nextCategory);
            props.loadProducts("category-select", 1);
            captureEvent("filter-change", {
              filterType: "category",
              value: nextCategory,
            });
          }}
        >
          <option value="">All categories</option>
          {props.filters.categories.map((category: string) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <p>Brand</p>
        <div className="brand-list">
          {props.filters.brands.map((brand: string) => (
            <button
              key={brand}
              type="button"
              className={
                props.brand === brand ? "brand-choice selected" : "brand-choice"
              }
              onClick={() => {
                const nextBrand = props.brand === brand ? "" : brand;
                props.setBrand(nextBrand);
                captureEvent("filter-change", {
                  filterType: "brand",
                  value: nextBrand,
                });
              }}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group price-fields">
        <p>Price</p>
        <label className="sr-only" htmlFor="min-price">
          Minimum price
        </label>
        <input
          id="min-price"
          placeholder="Min"
          value={props.minPrice}
          onChange={(event) => props.setMinPrice(event.target.value)}
        />
        <label className="sr-only" htmlFor="max-price">
          Maximum price
        </label>
        <input
          id="max-price"
          placeholder="Max"
          value={props.maxPrice}
          onChange={(event) => props.setMaxPrice(event.target.value)}
        />
        <button
          type="button"
          onClick={() => {
            props.loadProducts("price-filter", 1);
            captureEvent("filter-change", {
              filterType: "price",
              minPrice: props.minPrice,
              maxPrice: props.maxPrice,
            });
          }}
        >
          Apply price
        </button>
      </div>

      <div className="filter-group">
        <label htmlFor="grid-density">Grid density</label>
        <input
          id="grid-density"
          type="range"
          min="2"
          max="6"
          value={props.columns}
          onChange={(event) => {
            props.setColumns(Number(event.target.value));
            window.localStorage.setItem("catalogColumns", event.target.value);
          }}
        />
      </div>

      <label className="filter-group analytics-row" htmlFor="analytics-toggle">
        <input
          id="analytics-toggle"
          type="checkbox"
          checked={props.analyticsEnabled}
          onChange={(event) => props.setAnalyticsEnabled(event.target.checked)}
        />
        <span>Analytics refresh</span>
      </label>
    </aside>
  );
}

function ProductCard({
  product,
  addToCart,
  router,
  viewMode,
  setBrand,
  setCategory,
  setSelectedCategory,
  setPage,
  loadProducts,
  onCardKeyDown,
}: any) {
  const discount = getDiscountPercent(product);
  const urgency =
    product.stock === 0
      ? "Out of stock"
      : product.stock < 8
        ? `Only ${product.stock} left`
        : "In stock";

  return (
    <article
      className={`product-card ${viewMode}`}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${product.name}`}
      onClick={() => router.push(`/products/${product.id}`)}
      onKeyDown={(event) => onCardKeyDown(event, product.id)}
    >
      <div
        className="product-art"
        style={{
          background: `linear-gradient(135deg, ${product.color}, hsl(${product.imageSeed}, 72%, 78%))`,
        }}
      >
        <span>{product.category}</span>
      </div>
      <div className="product-body">
        <div className="product-title-row">
          <h3>{product.name}</h3>
          {discount ? <span className="discount">{discount}%</span> : null}
        </div>
        <p className="product-meta">
          {product.brand} - {product.subCategory}
        </p>
        <div className="rating-row">
          <span>{formatRating(product.rating)} star</span>
          <small>{product.reviewCount} reviews</small>
        </div>
        <div className="price-row">
          <strong>{formatCurrency(product.price)}</strong>
          <del>{formatCurrency(product.originalPrice)}</del>
        </div>
        <div className="tag-row">
          {product.tags.map((tag: string) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="card-actions">
          <button
            type="button"
            disabled={product.stock === 0}
            onClick={(event) => {
              event.stopPropagation();
              addToCart(product);
            }}
          >
            Add
          </button>
          <button
            type="button"
            className="quick-filter"
            onClick={(event) => {
              event.stopPropagation();
              setBrand(product.brand);
              setCategory(product.category);
              setSelectedCategory(product.category);
              setPage(1);
              loadProducts("quick-filter", 1);
            }}
          >
            Similar
          </button>
          <span className={product.stock === 0 ? "stock empty" : "stock"}>
            {urgency}
          </span>
        </div>
      </div>
    </article>
  );
}

function Pagination({ page, totalPages, changePage }: any) {
  const pages = Array.from({ length: Math.min(7, totalPages) }, (_, index) => {
    const start = Math.max(1, Math.min(page - 3, totalPages - 6));
    return start + index;
  });

  return (
    <nav className="pagination" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => changePage(page - 1)}
        aria-label="Go to previous page"
      >
        Previous
      </button>
      {pages.map((pageNumber: number) => (
        <button
          key={pageNumber}
          type="button"
          className={page === pageNumber ? "page-number active" : "page-number"}
          onClick={() => changePage(pageNumber)}
          aria-current={page === pageNumber ? "page" : undefined}
          aria-label={`Go to page ${pageNumber}`}
        >
          {pageNumber}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => changePage(page + 1)}
        aria-label="Go to next page"
      >
        Next
      </button>
    </nav>
  );
}
