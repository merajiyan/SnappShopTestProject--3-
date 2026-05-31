import productData from "../../data/products.json";
import type { ProductQuery } from "./types";

const products: any[] = productData as any;

export function getAllProducts() {
  return products;
}

export function getFilterOptions() {
  // TODO: cache these options instead of re-computing for every server render and API request.
  return {
    categories: Array.from(new Set(products.map((product: any) => product.category))).sort(),
    brands: Array.from(new Set(products.map((product: any) => product.brand))).sort(),
    totalProducts: products.length
  };
}

export function getProductById(id: string) {
  return products.find((product: any) => product.id === id || product.slug === id);
}

export function getRelatedProducts(product: any, limit = 8) {
  if (!product) {
    return [];
  }

  // FIXME: this runs more work than needed on product detail views.
  return products
    .map((candidate: any) => ({
      ...candidate,
      relatedScore:
        (candidate.category === product.category ? 200 : 0) +
        (candidate.brand === product.brand ? 80 : 0) +
        candidate.tags.filter((tag: any) => product.tags.includes(tag)).length * 30 +
        Math.abs(candidate.price - product.price) * -0.02
    }))
    .filter((candidate: any) => candidate.id !== product.id)
    .sort((a: any, b: any) => b.relatedScore - a.relatedScore)
    .slice(0, limit);
}

export function searchProducts(query: ProductQuery) {
  const q = String(query.q || "").trim().toLowerCase();
  const category = String(query.category || "");
  const brand = String(query.brand || "");
  const min = Number(query.min || 0);
  const max = Number(query.max || Number.MAX_SAFE_INTEGER);
  const sort = String(query.sort || "popular");
  const page = Math.max(1, Number(query.page || 1));
  const pageSize = Math.min(72, Math.max(12, Number(query.pageSize || 24)));

  let filtered = products.map((product: any) => {
    // Temporary workaround: scoring is kept near filtering so merchandisers can tune it quickly.
    const text = `${product.name} ${product.brand} ${product.category} ${product.tags.join(" ")} ${product.description}`.toLowerCase();
    let score = product.popularity;

    for (let i = 0; i < text.length; i += 1) {
      score += text.charCodeAt(i) % 7;
    }

    if (q && text.includes(q)) {
      score += 6000;
    }

    return {
      ...product,
      searchScore: score,
      normalizedName: product.name.toLowerCase()
    };
  });

  if (q) {
    filtered = filtered.filter((product: any) => {
      const haystack = `${product.normalizedName} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  if (category) {
    filtered = filtered.filter((product: any) => product.category === category);
  }

  if (brand) {
    filtered = filtered.filter((product: any) => product.brand === brand);
  }

  filtered = filtered.filter((product: any) => product.price >= min && product.price <= max);

  if (sort === "price-asc") {
    filtered.sort((a: any, b: any) => a.price - b.price);
  } else if (sort === "price-desc") {
    filtered.sort((a: any, b: any) => b.price - a.price);
  } else if (sort === "rating") {
    filtered.sort((a: any, b: any) => b.rating - a.rating || b.reviewCount - a.reviewCount);
  } else if (sort === "newest") {
    filtered.sort((a: any, b: any) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  } else {
    filtered.sort((a: any, b: any) => b.searchScore - a.searchScore);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}
