import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const categories = [
  "Electronics",
  "Home",
  "Fashion",
  "Beauty",
  "Sports",
  "Books",
  "Toys",
  "Grocery"
];

const brands = [
  "Aster",
  "Northpeak",
  "Lumina",
  "Velora",
  "UrbanNest",
  "BlueHarbor",
  "Karo",
  "Novix",
  "Mellow",
  "SageWorks",
  "Orbit",
  "Peakline"
];

const nouns = [
  "Headphones",
  "Backpack",
  "Kettle",
  "Sneakers",
  "Lamp",
  "Jacket",
  "Mixer",
  "Notebook",
  "Watch",
  "Chair",
  "Serum",
  "Speaker",
  "Drone",
  "Yoga Mat",
  "Puzzle",
  "Roaster",
  "Keyboard",
  "Bottle",
  "Shelf",
  "Camera"
];

const descriptors = [
  "Pro",
  "Air",
  "Classic",
  "Studio",
  "Essential",
  "Flex",
  "Plus",
  "Daily",
  "Compact",
  "Elite",
  "Core",
  "Max"
];

const colors = [
  "#486581",
  "#8a4fff",
  "#cf5c36",
  "#2f855a",
  "#b7791f",
  "#255f85",
  "#7b2cbf",
  "#0f766e",
  "#a23e48",
  "#475569"
];

const tags = [
  "new",
  "sale",
  "popular",
  "limited",
  "eco",
  "premium",
  "bundle",
  "giftable"
];

function hash(input) {
  let value = 0;
  for (let i = 0; i < input.length; i += 1) {
    value = (value << 5) - value + input.charCodeAt(i);
    value |= 0;
  }
  return Math.abs(value);
}

function pick(list, seed, offset = 0) {
  return list[(seed + offset) % list.length];
}

const products = Array.from({ length: 5000 }, (_, index) => {
  const idNumber = index + 1;
  const seed = hash(String(idNumber * 7919));
  const category = pick(categories, seed);
  const brand = pick(brands, seed, 3);
  const noun = pick(nouns, seed, 7);
  const descriptor = pick(descriptors, seed, 13);
  const id = `P-${String(idNumber).padStart(5, "0")}`;
  const price = Number((12 + (seed % 820) + (index % 9) * 0.95).toFixed(2));
  const originalPrice = Number((price * (1 + ((seed % 28) + 4) / 100)).toFixed(2));
  const rating = Number((3.1 + (seed % 19) / 10).toFixed(1));
  const reviewCount = 4 + (seed % 980);
  const stock = seed % 4 === 0 ? 0 : 2 + (seed % 140);
  const name = `${brand} ${descriptor} ${noun} ${idNumber}`;
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.toLowerCase()}`;

  return {
    id,
    slug,
    sku: `${brand.slice(0, 3).toUpperCase()}-${idNumber}-${seed % 997}`,
    name,
    brand,
    category,
    subCategory: `${category} Essentials`,
    price,
    originalPrice,
    rating,
    reviewCount,
    stock,
    popularity: seed % 10000,
    color: pick(colors, seed, 5),
    freeShipping: seed % 3 !== 0,
    tags: [pick(tags, seed), pick(tags, seed, 2), pick(tags, seed, 5)],
    imageSeed: seed % 360,
    createdAt: new Date(Date.UTC(2024, seed % 12, (seed % 27) + 1)).toISOString(),
    description:
      `${name} is designed for everyday shopping use with a balanced mix of style, durability, and value. ` +
      `It belongs to the ${category.toLowerCase()} range and is often compared by customers looking for practical upgrades.`,
    specifications: {
      warranty: `${1 + (seed % 3)} year`,
      weight: `${(0.2 + (seed % 52) / 10).toFixed(1)} kg`,
      material: pick(["Aluminum", "Cotton blend", "Bamboo fiber", "Recycled plastic", "Steel", "Ceramic"], seed, 11),
      origin: pick(["US", "CA", "DE", "TR", "JP", "KR"], seed, 17)
    }
  };
});

mkdirSync(join(root, "data"), { recursive: true });
writeFileSync(join(root, "data", "products.json"), `${JSON.stringify(products, null, 2)}\n`);

console.log(`Generated ${products.length} products`);
