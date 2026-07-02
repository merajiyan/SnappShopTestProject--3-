import type { Metadata } from "next";
import CatalogShell from "./components/CatalogShell";
import {
  getAllProducts,
  getFilterOptions,
  searchProducts,
} from "./lib/catalog";

type ProductListingPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildCanonicalPath(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  const q = typeof searchParams.q === "string" ? searchParams.q : "";
  const category =
    typeof searchParams.category === "string" ? searchParams.category : "";
  const brand =
    typeof searchParams.brand === "string" ? searchParams.brand : "";
  const sort = typeof searchParams.sort === "string" ? searchParams.sort : "";

  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (brand) params.set("brand", brand);
  if (sort) params.set("sort", sort);

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

export async function generateMetadata({
  searchParams,
}: ProductListingPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const category = typeof params.category === "string" ? params.category : "";
  const sort = typeof params.sort === "string" ? params.sort : "";
  const title = q
    ? `Search results for ${q} | Snapshop`
    : category
      ? `${category} products | Snapshop`
      : "Shop products | Snapshop";
  const description = q
    ? `Browse ${q} with sorting, filters, and live inventory updates.`
    : category
      ? `Explore ${category} products with curated sorting and personalized recommendations.`
      : "Browse the Snapshop catalog with searchable, filterable, and SEO-friendly product listings.";

  return {
    title,
    description,
    alternates: {
      canonical: buildCanonicalPath(params),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductListingPage({
  searchParams,
}: ProductListingPageProps) {
  const params = await searchParams;
  const initialQuery = {
    page: 1,
    pageSize: 24,
    q: typeof params.q === "string" ? params.q : "",
    category: typeof params.category === "string" ? params.category : "",
    brand: typeof params.brand === "string" ? params.brand : "",
    min: typeof params.min === "string" ? params.min : "",
    max: typeof params.max === "string" ? params.max : "",
    sort: typeof params.sort === "string" ? params.sort : "popular",
  };
  const initialResults = searchProducts(initialQuery);

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Snapshop product catalog",
    numberOfItems: initialResults.total,
    itemListElement: initialResults.items
      .slice(0, 10)
      .map((product: any, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        url: `https://snapshop.example/products/${product.slug}`,
        name: product.name,
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <CatalogShell
        initialProducts={initialResults.items}
        initialTotal={initialResults.total}
        initialTotalPages={initialResults.totalPages}
        filters={getFilterOptions()}
        allProducts={getAllProducts()}
      />
    </>
  );
}
