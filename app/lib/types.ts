export type Product = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  stock: number;
  popularity: number;
  color: string;
  freeShipping: boolean;
  tags: string[];
  imageSeed: number;
  createdAt: string;
  description: string;
  specifications: any;
  [key: string]: any;
};

export type ProductQuery = {
  q?: string;
  category?: string;
  brand?: string;
  min?: string | number;
  max?: string | number;
  sort?: string;
  page?: string | number;
  pageSize?: string | number;
};

export type ProductResponse = {
  items: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  serverTime: string;
  requestId: string;
};
