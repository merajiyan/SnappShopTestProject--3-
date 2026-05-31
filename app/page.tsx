import CatalogShell from "./components/CatalogShell";
import { getAllProducts, getFilterOptions, searchProducts } from "./lib/catalog";

export default function ProductListingPage() {
  const initialQuery = {
    page: 1,
    pageSize: 24,
    sort: "popular"
  };
  const initialResults = searchProducts(initialQuery);

  return (
    <CatalogShell
      initialProducts={initialResults.items}
      initialTotal={initialResults.total}
      initialTotalPages={initialResults.totalPages}
      filters={getFilterOptions()}
      allProducts={getAllProducts()}
    />
  );
}
