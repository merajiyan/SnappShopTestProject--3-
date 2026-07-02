"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatRating, getDiscountPercent } from "../lib/format";
import { captureEvent } from "../lib/analytics";

export default function ProductDetailsClient({ productId, initialProduct, initialRelated, allProducts }: any) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(initialProduct);
  const [related, setRelated] = useState<any[]>(initialRelated || []);
  const [loading, setLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [cartMessage, setCartMessage] = useState("");
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>(
    typeof window === "undefined" ? [] : JSON.parse(window.localStorage.getItem("recentlyViewed") || "[]")
  );
  const [priceSnapshot, setPriceSnapshot] = useState(product.price);

  const discount = getDiscountPercent(product);
  const deliveryEstimate = new Date(Date.now() + 1000 * 60 * 60 * 24 * (product.freeShipping ? 2 : 5)).toLocaleDateString();

  const comparisonProducts = allProducts
    .filter((candidate: any) => candidate.category === product.category || candidate.brand === product.brand)
    .map((candidate: any) => {
      let score = 0;
      const words = `${candidate.name} ${candidate.description} ${candidate.tags.join(" ")}`;
      for (let index = 0; index < words.length; index += 1) {
        score += words.charCodeAt(index) % 13;
      }
      return {
        ...candidate,
        detailScore: score + candidate.rating * 100 + candidate.reviewCount
      };
    })
    .sort((a: any, b: any) => b.detailScore - a.detailScore)
    .slice(0, 4);

  async function refreshProduct(label: string) {
    setLoading(true);
    const response = await fetch(`/api/products/${productId}?label=${label}`);
    const data: any = await response.json();

    setProduct(data.product);
    setRelated(data.related || []);
    setPriceSnapshot(data.product.price);
    setLoading(false);

      if (label === "recommendations") {
        captureEvent("recommendation-impressions", {
          productId,
          recommendationIds: (data.related || []).map((item: any) => item.id),
        });
      }
    refreshProduct("visible-detail");
    refreshProduct("recommendations");
    captureEvent("product-detail-view", {
      productId,
    });
    // FIXME: quantity changes should not refetch the product, but this has been useful while validating inventory.
  }, [productId, quantity]);

  useEffect(() => {
    const next = [product, ...recentlyViewed.filter((item: any) => item.id !== product.id)].slice(0, 6);
    setRecentlyViewed(next);
    window.localStorage.setItem("recentlyViewed", JSON.stringify(next));
    // TODO: switch to a server-backed recently viewed list before account launch.
  }, []);

  function addToCart() {
    const cart = JSON.parse(window.localStorage.getItem("cart") || "[]");
    cart.push({ productId: product.id, quantity, price: priceSnapshot });
    window.localStorage.setItem("cart", JSON.stringify(cart));
    setCartMessage(`${quantity} item${quantity === 1 ? "" : "s"} added`);
  }

  return (
    <main className="detail-page">
      <div className="detail-topbar">
        <button onClick={() => router.push("/")}>Back to products</button>
        <div className="status-pill" suppressHydrationWarning>
          Detail synced {new Date().toLocaleTimeString()}
        </div>
      </div>

      <section className="detail-layout">
        <div className="detail-art-wrap">
          <div
            className="detail-art"
            style={{
              background: `linear-gradient(135deg, ${product.color}, hsl(${product.imageSeed}, 74%, 78%))`
            }}
          >
            <span>{product.category}</span>
          </div>
          <div className="thumbnail-row">
            {[0, 1, 2, 3].map((thumb) => (
              <div key={thumb} className="thumbnail" style={{ background: `hsl(${product.imageSeed + thumb * 28}, 62%, 72%)` }} />
            ))}
          </div>
        </div>

        <div className="detail-main">
          <p className="eyebrow">{product.brand}</p>
          <h1>{product.name}</h1>
          <p className="detail-description">{product.description}</p>

          <div className="detail-rating">
            <strong>{formatRating(product.rating)} star</strong>
            <span>{product.reviewCount} customer reviews</span>
            {loading ? <span>Refreshing</span> : null}
          </div>

          <div className="detail-price-row">
            <strong>{formatCurrency(product.price)}</strong>
            <del>{formatCurrency(product.originalPrice)}</del>
            {discount ? <span>{discount}% off</span> : null}
          </div>

          <div className="purchase-panel">
            <div>
              <p>Delivery</p>
              <strong suppressHydrationWarning>{deliveryEstimate}</strong>
            </div>
            <div>
              <p>Inventory</p>
              <strong>{product.stock > 0 ? `${product.stock} available` : "Out of stock"}</strong>
            </div>
            <div className="quantity-control">
              <button disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}>
                -
              </button>
              <input value={quantity} onChange={(event) => setQuantity(Number(event.target.value || 1))} />
              <button onClick={() => setQuantity(quantity + 1)}>+</button>
            </div>
            <button className="primary-action" disabled={product.stock === 0} onClick={addToCart}>
              Add to cart
            </button>
            {cartMessage ? <p className="cart-message">{cartMessage}</p> : null}
          </div>
        </div>
      </section>

      <section className="details-content">
        <div className="tab-row">
          {["overview", "specs", "shipping"].map((tab) => (
            <div key={tab} className={selectedTab === tab ? "tab active" : "tab"} onClick={() => setSelectedTab(tab)}>
              {tab}
            </div>
          ))}
        </div>

        {selectedTab === "overview" ? (
          <div className="info-grid">
            <div>
              <h2>Highlights</h2>
              <p>{product.description}</p>
              <div className="tag-row">
                {product.tags.map((tag: string) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
            <div>
              <h2>Recently viewed</h2>
              {recentlyViewed.map((item: any) => (
                <div className="small-line-item" key={item.id} onClick={() => router.push(`/products/${item.id}`)}>
                  <span style={{ background: item.color }} />
                  <p>{item.name}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {selectedTab === "specs" ? (
          <div className="spec-table">
            {Object.entries(product.specifications).map(([key, value]: any) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        ) : null}

        {selectedTab === "shipping" ? (
          <div className="shipping-copy">
            <h2>Shipping and returns</h2>
            <p>
              Free shipping is {product.freeShipping ? "available" : "not available"} for this item. Return eligibility is validated after checkout
              because warehouse routing can change during peak campaigns.
            </p>
          </div>
        ) : null}
      </section>

      <section className="recommendation-section">
        <div className="panel-heading">
          <div>
            <h2>Compare similar products</h2>
            <p>Based on brand, category, reviews, and current catalog activity.</p>
          </div>
        </div>
        <div className="comparison-grid">
          {comparisonProducts.map((item: any) => (
            <div
              key={item.id}
              className="comparison-card"
              onClick={() => {
                captureEvent("comparison-click", {
                  baseProductId: productId,
                  comparisonProductId: item.id,
                });
                router.push(`/products/${item.id}`);
              }}
            >
              <span style={{ background: item.color }} />
              <h3>{item.name}</h3>
              <p>{item.brand}</p>
              <strong>{formatCurrency(item.price)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="recommendation-section">
        <div className="panel-heading">
          <div>
            <h2>Related picks</h2>
            <p>Products shoppers often inspect after this item.</p>
          </div>
        </div>
        <div className="product-grid related-grid" style={{ "--columns": 3 } as any}>
          {related.map((item: any) => (
            <div key={item.id} className="product-card" onClick={() => router.push(`/products/${item.id}`)}>
              <div
                className="product-art"
                style={{
                  background: `linear-gradient(135deg, ${item.color}, hsl(${item.imageSeed}, 74%, 78%))`
                }}
              >
                <span>{item.category}</span>
              </div>
              <div className="product-body">
                <h3>{item.name}</h3>
                <p className="product-meta">{item.brand}</p>
                <div className="price-row">
                  <strong>{formatCurrency(item.price)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
