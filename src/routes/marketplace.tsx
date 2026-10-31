import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, SiteLayout } from "@/components/site/SiteLayout";
import { ListingCard } from "@/components/site/ListingCard";
import type React from "react";
import { categories, filterListings, type ListingFilters } from "@/lib/listings";
import { useSuspenseQuery } from "@tanstack/react-query";
import { marketplaceQuery } from "@/lib/marketplace.queries";

const searchSchema = z.object({
  q: z.string().optional(),
  category: z.enum(["adsense", "affiliate", "ecommerce", "directory", "service"]).optional(),
  type: z.enum(["fixed", "auction"]).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "ending"]).optional(),
});

export const Route = createFileRoute("/marketplace")({
  loader: ({ context }) => context.queryClient.ensureQueryData(marketplaceQuery),
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Marketplace — Websites for sale in Pakistan & South Asia | ClicksSpot" },
      {
        name: "description",
        content: "Browse verified AdSense blogs, affiliate sites, online stores and portals for sale.",
      },
      { property: "og:title", content: "ClicksSpot Marketplace" },
      {
        property: "og:description",
        content: "Browse verified websites for sale across Pakistan & South Asia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Marketplace,
});

const ALL = "all";

function Marketplace() {
  const { data: listings } = useSuspenseQuery(marketplaceQuery);
  const s = Route.useSearch();
  const navigate = useNavigate({ from: "/marketplace" });
  const set = (patch: Partial<ListingFilters>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  const results = filterListings(listings, s);

  return (
    <SiteLayout>
      <PageHeader
        title="Marketplace"
        subtitle="Verified websites from Pakistan & South Asia."
      />
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside aria-label="Filters" className="lg:sticky lg:top-24 lg:self-start">
          <div className="space-y-5 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-base font-semibold">Filters</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate({ search: {} })}>
                Reset
              </Button>
            </div>
            <FilterGroup label="Search">
              <Input
                placeholder="Search…"
                defaultValue={s.q}
                aria-label="Search"
                onKeyDown={(e) =>
                  e.key === "Enter" && set({ q: e.currentTarget.value || undefined })
                }
              />
            </FilterGroup>
            <FilterGroup label="Category">
              <div className="flex flex-col gap-1">
                {[{ id: undefined, label: "All categories" }, ...categories].map((c) => {
                  const active = s.category === c.id;
                  return (
                    <button
                      key={c.label}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set({ category: c.id as ListingFilters["category"] })}
                      className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </FilterGroup>
            <FilterGroup label="Sale type">
              <Select
                value={s.type ?? ALL}
                onValueChange={(v) =>
                  set({ type: v === ALL ? undefined : (v as ListingFilters["type"]) })
                }
              >
                <SelectTrigger aria-label="Sale type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Any type</SelectItem>
                  <SelectItem value="fixed">Fixed price</SelectItem>
                  <SelectItem value="auction">Auction</SelectItem>
                </SelectContent>
              </Select>
            </FilterGroup>
            <FilterGroup label="Price (USD)">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  min={0}
                  key={`min-${s.minPrice}`}
                  defaultValue={s.minPrice}
                  aria-label="Min price"
                  onBlur={(e) =>
                    set({
                      minPrice: e.currentTarget.value ? Number(e.currentTarget.value) : undefined,
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Max"
                  min={0}
                  key={`max-${s.maxPrice}`}
                  defaultValue={s.maxPrice}
                  aria-label="Max price"
                  onBlur={(e) =>
                    set({
                      maxPrice: e.currentTarget.value ? Number(e.currentTarget.value) : undefined,
                    })
                  }
                />
              </div>
            </FilterGroup>
          </div>
        </aside>
        <section aria-label="Results">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{results.length}</span> listings
            </p>
            <div className="w-52">
              <Select
                value={s.sort ?? "newest"}
                onValueChange={(v) => set({ sort: v as ListingFilters["sort"] })}
              >
                <SelectTrigger aria-label="Sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price_asc">Price: low to high</SelectItem>
                  <SelectItem value="price_desc">Price: high to low</SelectItem>
                  <SelectItem value="ending">Ending soon</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {results.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed p-12 text-center">
              <p className="font-medium">No listings match your filters.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate({ search: {} })}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          )}
        </section>
      </div>
    </SiteLayout>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 border-t pt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
