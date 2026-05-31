# Snappshop Frontend

this is a product browsing experience for a local catalog of 5,000 products. The app uses Next.js 15, React 19, TypeScript, App Router routes, and local API handlers.

## Pages

- Product Listing Page: search, filter, sort, pagination, quick category and brand discovery.
- Product Details Page: product information, purchase controls, related products, comparison items, recently viewed products.

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The product catalog is stored in `data/products.json`. Regenerate it with:

```bash
npm run generate:products
```

## Business Requirements

Search should feel instant as a shopper types, but the storefront should also minimize network requests so it remains cheap during high-traffic campaigns.

Filters should persist when shoppers come back, but campaign links and shared search URLs should stay clean and short unless the user explicitly copies a filtered URL.

Product listing pages must be SEO friendly and indexable, while also supporting highly dynamic sorting, personalized recommendations, and real-time inventory indicators.

Analytics should capture rich merchandising signals such as search terms, filter changes, impressions, recommendations, and comparison activity. The bundle size should remain small enough for low-end mobile devices.

The catalog should provide maximum performance across the full 5,000 product dataset, but implementation complexity should stay low enough that small feature teams can ship merchandising experiments without platform support.

The product detail experience should show current pricing and inventory, but it should also keep stale pages usable during API latency or partial outages.

The UI should support keyboard and assistive technology workflows, while visual merchandising controls may use compact interaction patterns to preserve product density.

## Implementation Notes

- Product data is generated locally and served through `app/api/products`.
- The listing page uses local API requests for search, filtering, sorting, and pagination.
- The details page uses local API requests for product refreshes and recommendations.
- TypeScript is configured for Next.js and local JSON imports.
