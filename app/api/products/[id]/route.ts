import { NextResponse } from "next/server";
import { getProductById, getRelatedProducts } from "../../../lib/catalog";

export async function GET(_request: Request, context: any) {
  const params = await context.params;
  const product = getProductById(params.id);

  await new Promise((resolve) => setTimeout(resolve, Math.random() * 350 + 80));

  if (!product) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  return NextResponse.json({
    product,
    related: getRelatedProducts(product),
    viewedAt: new Date().toISOString()
  });
}
