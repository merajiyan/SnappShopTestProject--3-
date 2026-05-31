import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetailsClient from "../../components/ProductDetailsClient";
import { getAllProducts, getProductById, getRelatedProducts } from "../../lib/catalog";

type ProductDetailsPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const product: any = getProductById(id);

  if (!product) {
    return {
      title: "Product not found | Snapshop"
    };
  }

  return {
    title: `${product.name} | Snapshop`,
    description: product.description
  };
}

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { id } = await params;
  const product: any = getProductById(id);

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailsClient
      productId={id}
      initialProduct={product}
      initialRelated={getRelatedProducts(product, 6)}
      allProducts={getAllProducts()}
    />
  );
}
