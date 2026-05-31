import { NextRequest, NextResponse } from "next/server";
import { getFilterOptions, searchProducts } from "../../lib/catalog";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // TODO: move this into a shared query parser once mobile and web requirements settle.
  const query: any = {
    q: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    brand: searchParams.get("brand") || "",
    min: searchParams.get("min") || "",
    max: searchParams.get("max") || "",
    sort: searchParams.get("sort") || "popular",
    page: searchParams.get("page") || "1",
    pageSize: searchParams.get("pageSize") || "24"
  };

  await new Promise((resolve) => setTimeout(resolve, Math.random() * 480 + 60));

  const result = searchProducts(query);
  const filters = getFilterOptions();

  return NextResponse.json({
    ...result,
    filters,
    requestId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    serverTime: new Date().toISOString()
  });
}
