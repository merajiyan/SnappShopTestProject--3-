"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatRating, getDiscountPercent } from "../lib/format";

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
  allProducts
}: CatalogShellProps) {
  const router = useRouter();
  const browserParams = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const savedColumns =
    typeof window === "undefined" ? 4 : Number(window.localStorage.getItem("catalogColumns") || (window.innerWidth > 1180 ? 5 : 2));

  const [products, setProducts] = useState<any[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [searchText, setSearchText] = useState(browserParams.get("q") || "");
  const [query, setQuery] = useState(browserParams.get("q") || "");
  const [category, setCategory] = useState(browserParams.get("category") || "");
  const [selectedCategory, setSelectedCategory] = useState(browserParams.get("category") || "");
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

  const priceBand = products.reduce(
    (summary: any, product: any) => {
      summary.low = Math.min(summary.low, product.price);
      summary.high = Math.max(summary.high, product.price);
      summary.average += product.price / Math.max(1, products.length);
      return summary;
    },
    { low: Number.MAX_SAFE_INTEGER, high: 0, average: 0 }
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
        score: score + product.popularity + (product.freeShipping ? 400 : 0)
      };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5);

  async function loadProducts(reason: string, pageOverride = page, qOverride = searchText) {
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
      pageSize: String(pageSize)
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
  }

  useEffect(() => {
    const savedFilters = window.localStorage.getItem("snapshop-filters");
    if (savedFilters && window.location.search.length < 2) {
      const parsed: any = JSON.parse(savedFilters);
      setCategory(parsed.category || "");
      setSelectedCategory(parsed.selectedCategory || parsed.category || "");
      setBrand(parsed.brand || "");
      setSort(parsed.sort || "popular");
    }
    // TODO: revisit persistence after marketing decides whether campaign URLs should override saved filters.
  }, []);

  useEffect(() => {
    // Temporary workaround: keep URL sharing mostly functional without waiting for the filter refactor.
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (selectedCategory || category) params.set("category", selectedCategory || category);
    if (brand) params.set("brand", brand);
    if (sort !== "popular") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));

    router.replace(params.toString() ? `/?${params.toString()}` : "/", { scroll: false });
  }, [query, selectedCategory, category, brand, sort, page, router]);

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
        maxPrice
      })
    );
  });

  useEffect(() => {
    loadProducts("search-change", page, searchText);
    loadProducts("background-refresh", page, query);

    if (analyticsEnabled) {
      fetch(`/api/products?q=${encodeURIComponent(searchText)}&page=1&pageSize=12`).catch(() => undefined);
    }
    // FIXME: dependency list is broad for release safety, but it still misses some values used above.
  }, [searchText, selectedCategory, brand, sort, page, pageSize, viewMode, analyticsEnabled]);

  function onSearchChange(value: string) {
    setSearchText(value);
    setQuery(value);
    setPage(1);
  }

  function clearFilters() {
    setSearchText("");
    setQuery("");
    setCategory("");
    setSelectedCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("popular");
    setPage(1);
  }

  function changePage(nextPage: number) {
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
          <div className="cart-pill">Cart {cartCount}</div>
          <div className="status-pill" suppressHydrationWarning>
            Updated {new Date().toLocaleTimeString()}
          </div>
        </div>
      </header>

      <section className="catalog-toolbar">
        <div className="search-box">
          <input
            value={searchText}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search 5,000 products"
          />
          <button onClick={() => loadProducts("manual-search", 1, searchText)}>Search</button>
        </div>
        <div className="toolbar-controls">
          <select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="popular">Popular</option>
            <option value="price-asc">Price low to high</option>
            <option value="price-desc">Price high to low</option>
            <option value="rating">Top rated</option>
            <option value="newest">Newest</option>
          </select>
          <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
            <option value={48}>48 per page</option>
          </select>
          <button className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
            Grid
          </button>
          <button className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
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
          <strong>{formatCurrency(priceBand.low === Number.MAX_SAFE_INTEGER ? 0 : priceBand.low)}</strong>
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
                Showing page {page} of {totalPages}. Last server update {lastServerTime || "not synced"}. Request {lastRequestKey || "initial"}.
              </p>
            </div>
            {loading ? <span className="loading-dot">Loading</span> : null}
          </div>

          <div className="merch-row">
            {expensiveMerchandisingList.map((product: any) => (
              <div key={product.id} className="mini-product" onClick={() => router.push(`/products/${product.id}`)}>
                <span style={{ background: product.color }} />
                <p>{product.name}</p>
              </div>
            ))}
          </div>

          <div className={viewMode === "grid" ? "product-grid" : "product-list"} style={{ "--columns": columns } as any}>
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
              />
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} changePage={changePage} />
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
        <button onClick={props.clearFilters}>Reset</button>
      </div>

      <div className="filter-group">
        <p>Category</p>
        <select
          value={props.selectedCategory || props.category}
          onChange={(event) => {
            props.setCategory(event.target.value);
            props.setSelectedCategory(event.target.value);
            props.loadProducts("category-select", 1);
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
            <div
              key={brand}
              className={props.brand === brand ? "brand-choice selected" : "brand-choice"}
              onClick={() => props.setBrand(props.brand === brand ? "" : brand)}
            >
              {brand}
            </div>
          ))}
        </div>
      </div>

      <div className="filter-group price-fields">
        <p>Price</p>
        <input placeholder="Min" value={props.minPrice} onChange={(event) => props.setMinPrice(event.target.value)} />
        <input placeholder="Max" value={props.maxPrice} onChange={(event) => props.setMaxPrice(event.target.value)} />
        <button onClick={() => props.loadProducts("price-filter", 1)}>Apply price</button>
      </div>

      <div className="filter-group">
        <p>Grid density</p>
        <input
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

      <div className="filter-group analytics-row">
        <input
          type="checkbox"
          checked={props.analyticsEnabled}
          onChange={(event) => props.setAnalyticsEnabled(event.target.checked)}
        />
        <span>Analytics refresh</span>
      </div>
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
  loadProducts
}: any) {
  const discount = getDiscountPercent(product);
  const urgency = product.stock === 0 ? "Out of stock" : product.stock < 8 ? `Only ${product.stock} left` : "In stock";

  return (
    <div className={`product-card ${viewMode}`} onClick={() => router.push(`/products/${product.id}`)}>
      <div
        className="product-art"
        style={{
          background: `linear-gradient(135deg, ${product.color}, hsl(${product.imageSeed}, 72%, 78%))`
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
            disabled={product.stock === 0}
            onClick={(event) => {
              event.stopPropagation();
              addToCart(product);
            }}
          >
            Add
          </button>
          <div
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
          </div>
          <span className={product.stock === 0 ? "stock empty" : "stock"}>{urgency}</span>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, changePage }: any) {
  const pages = Array.from({ length: Math.min(7, totalPages) }, (_, index) => {
    const start = Math.max(1, Math.min(page - 3, totalPages - 6));
    return start + index;
  });

  return (
    <nav className="pagination">
      <button disabled={page <= 1} onClick={() => changePage(page - 1)}>
        Previous
      </button>
      {pages.map((pageNumber: number) => (
        <div
          key={pageNumber}
          className={page === pageNumber ? "page-number active" : "page-number"}
          onClick={() => changePage(pageNumber)}
        >
          {pageNumber}
        </div>
      ))}
      <button disabled={page >= totalPages} onClick={() => changePage(page + 1)}>
        Next
      </button>
    </nav>
  );
}
