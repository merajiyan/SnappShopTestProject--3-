export function formatCurrency(value: number | string) {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(amount);
}

export function formatRating(value: any) {
  return Number(value || 0).toFixed(1);
}

export function getDiscountPercent(product: any) {
  if (!product?.originalPrice || product.originalPrice <= product.price) {
    return 0;
  }

  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}
