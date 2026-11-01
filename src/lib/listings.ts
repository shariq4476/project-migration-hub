// Demo listings for the public site. Will move to Lovable Cloud in the listings phase.
// Public status labels are limited to Active / Sale in progress / Sold (deal stages stay private).
export type PublicStatus = "active" | "in_progress" | "sold";
export type Category = "adsense" | "affiliate" | "ecommerce" | "directory" | "service";
export type SaleType = "fixed" | "auction";

export const COMMISSION_RATE = 0.1;

export const categories: { id: Category; label: string }[] = [
  { id: "adsense", label: "AdSense & blogs" },
  { id: "affiliate", label: "Affiliate sites" },
  { id: "ecommerce", label: "E-commerce stores" },
  { id: "directory", label: "Portals & directories" },
  { id: "service", label: "Service & lead gen" },
];

export const publicStatusLabel: Record<PublicStatus, string> = {
  active: "Active",
  in_progress: "Sale in progress",
  sold: "Sold",
};

export interface Listing {
  id: string;
  databaseId?: string;
  sellerId?: string | null;
  images?: string[];
  imageUrls?: string[];
  bidCount?: number;
  url?: string | undefined;
  title: string;
  category: Category;
  type: SaleType;
  price: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  monthlyTraffic: number;
  ageYears: number;
  status: PublicStatus;
  featured: boolean;
  createdAt: string;
  endsAt?: string | undefined;
  summary: string;
  description: string;
  verified: string[];
  seller: {
    name: string;
    rating: number;
    reviews: number;
    deals: number;
    verified: boolean;
    memberSince?: string | undefined;
    country?: string | undefined;
    idVerified?: boolean;
    phoneVerified?: boolean;
    paymentVerified?: boolean;
  };
}

export const listings: Listing[] = [
  { id: "trailgear-shop", title: "TrailGear.pk — Outdoor gear WooCommerce store", category: "ecommerce", type: "fixed", price: 148000, monthlyRevenue: 21400, monthlyProfit: 4900, monthlyTraffic: 61000, ageYears: 5, status: "active", featured: true, createdAt: "2026-10-28", summary: "Shopify store with 3 private-label products and repeat buyers.", description: "Established outdoor gear brand with a loyal email list of 18k subscribers, supplier contracts transferable, and a lean 2-person operation.", verified: ["Domain", "Analytics", "Revenue"], seller: { name: "Hamza R.", rating: 4.9, reviews: 23, deals: 11, verified: true } },
  { id: "invoicely-saas", title: "TaleemHub — Pakistani education portal", category: "directory", type: "auction", price: 92000, monthlyRevenue: 6800, monthlyProfit: 5300, monthlyTraffic: 14000, ageYears: 3, status: "active", featured: true, createdAt: "2026-10-30", endsAt: "2026-11-06", summary: "Profitable micro-SaaS, 410 paying customers, low churn.", description: "Next.js + Postgres codebase, fully documented. Churn under 3% monthly. Seller offers 30 days of handover support.", verified: ["Domain", "Analytics"], seller: { name: "Sara K.", rating: 4.8, reviews: 9, deals: 4, verified: true } },
  { id: "cryptobrief-blog", title: "TechKhabar — Urdu tech news blog", category: "adsense", type: "fixed", price: 36500, monthlyRevenue: 1900, monthlyProfit: 1650, monthlyTraffic: 120000, ageYears: 4, status: "active", featured: true, createdAt: "2026-10-25", summary: "Ad + affiliate monetized, 700+ articles, strong organic traffic.", description: "Mostly evergreen content with steady Google traffic. Writers on retainer can continue with the new owner.", verified: ["Domain", "Analytics"], seller: { name: "Daniel M.", rating: 4.7, reviews: 14, deals: 8, verified: true } },
  { id: "pixeltools-domain", title: "MobilePriceZone — Phone review affiliate site", category: "affiliate", type: "auction", price: 12500, monthlyRevenue: 0, monthlyProfit: 0, monthlyTraffic: 900, ageYears: 12, status: "active", featured: false, createdAt: "2026-10-29", endsAt: "2026-11-03", summary: "Two-word brandable .com, registered since 2014.", description: "Clean history, ideal for a design tools startup. Transfer via registrar push.", verified: ["Domain"], seller: { name: "Ali N.", rating: 5, reviews: 31, deals: 27, verified: true } },
  { id: "fitplan-app", title: "LahoreMovers — Lead generation website", category: "service", type: "fixed", price: 54000, monthlyRevenue: 3200, monthlyProfit: 2400, monthlyTraffic: 22000, ageYears: 2, status: "active", featured: false, createdAt: "2026-10-22", summary: "iOS + Android app with subscriptions and 4.6★ rating.", description: "React Native codebase, 38k downloads, 1.2k active subscribers.", verified: ["Revenue"], seller: { name: "Mira T.", rating: 4.6, reviews: 5, deals: 2, verified: false } },
  { id: "petnest-store", title: "DesiKitchen — Spices online store", category: "ecommerce", type: "fixed", price: 28000, monthlyRevenue: 9200, monthlyProfit: 1500, monthlyTraffic: 31000, ageYears: 2, status: "in_progress", featured: false, createdAt: "2026-10-12", summary: "Dropshipping store with US suppliers, fast shipping.", description: "Automated fulfilment, TikTok ad playbooks included.", verified: ["Domain"], seller: { name: "Omar F.", rating: 4.5, reviews: 7, deals: 3, verified: true } },
  { id: "devjobs-board", title: "RozgarPK — Job listings board", category: "directory", type: "fixed", price: 67000, monthlyRevenue: 4100, monthlyProfit: 3600, monthlyTraffic: 48000, ageYears: 6, status: "active", featured: false, createdAt: "2026-10-20", summary: "Niche job board with paid postings and a 25k newsletter.", description: "Employers pay per post; recurring clients make up 60% of revenue.", verified: ["Domain", "Analytics", "Revenue"], seller: { name: "Lena P.", rating: 4.9, reviews: 12, deals: 6, verified: true } },
  { id: "recipehub-site", title: "DesiRecipes — Recipe content site", category: "adsense", type: "fixed", price: 19000, monthlyRevenue: 950, monthlyProfit: 880, monthlyTraffic: 75000, ageYears: 3, status: "sold", featured: false, createdAt: "2026-09-30", summary: "Display-ad monetized recipe site, Pinterest traffic.", description: "Sold through ClicksSpot.", verified: ["Analytics"], seller: { name: "Aisha B.", rating: 4.8, reviews: 4, deals: 2, verified: true } },
];

export function getListing(id: string) {
  return listings.find((l) => l.id === id);
}

export type SortKey = "newest" | "price_asc" | "price_desc" | "ending";
export interface ListingFilters {
  q?: string | undefined;
  category?: Category | undefined;
  type?: SaleType | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  sort?: SortKey | undefined;
}

export function filterListings(all: Listing[], f: ListingFilters) {
  const q = f.q?.trim().toLowerCase();
  const out = all.filter(
    (l) =>
      (!q || l.title.toLowerCase().includes(q) || l.summary.toLowerCase().includes(q)) &&
      (!f.category || l.category === f.category) &&
      (!f.type || l.type === f.type) &&
      (f.minPrice == null || l.price >= f.minPrice) &&
      (f.maxPrice == null || l.price <= f.maxPrice),
  );
  const sort = f.sort ?? "newest";
  return out.sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    if (sort === "ending") return (a.endsAt ?? "9999").localeCompare(b.endsAt ?? "9999");
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function commissionFor(price: number) {
  return Math.round(price * COMMISSION_RATE * 100) / 100;
}

import { formatMoney, activeCurrency } from "@/lib/currency";
/** Price in the visitor's chosen currency (USD by default). */
export const usd = (n: number) => formatMoney(n, activeCurrency());
/** Exact US dollar amount — for payments, payouts and admin records. */
export const usdExact = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
export const compact = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);
