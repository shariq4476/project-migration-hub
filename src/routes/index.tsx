import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldCheck, Handshake, Wallet, BadgeCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ListingCard } from "@/components/site/ListingCard";
import { categories, listings } from "@/lib/listings";
import { faqs } from "@/lib/content";
import { useSuspenseQuery } from "@tanstack/react-query";
import { marketplaceQuery } from "@/lib/marketplace.queries";
import marketplaceCover from "@/assets/marketplace-cover.jpg";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(marketplaceQuery),
  head: () => ({
    meta: [
      { title: "ClicksSpot — Buy and sell websites in Pakistan & South Asia" },
      {
        name: "description",
        content:
          "Pakistan's safe marketplace for AdSense blogs, affiliate sites and online stores. Escrow holds funds until the buyer confirms.",
      },
      { property: "og:title", content: "ClicksSpot — Safe website marketplace for Pakistan & South Asia" },
      {
        property: "og:description",
        content: "Verified websites, escrow protection and local payments — no more risky Facebook group deals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: listings } = useSuspenseQuery(marketplaceQuery);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const featured = listings.filter((l) => l.featured && l.status === "active");
  const recent = [...listings]
    .filter((l) => l.status === "active")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-navy text-navy-foreground">
        <img
          src={marketplaceCover}
          alt="Digital businesses on laptop screens"
          width={1920}
          height={1024}
          className="marketplace-cover"
        />
        <div className="cover-shade" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 md:py-20">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-navy-2 px-3 py-1 text-xs text-navy-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Pakistan & South Asia's website marketplace
          </p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight md:text-5xl">
            ClicksSpot{" "}
            <span className="block text-primary">Buy and sell websites safely.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-navy-muted">
            AdSense blogs, affiliate sites and online stores with verified traffic — and escrow that holds payment until the buyer confirms. No more scams in Facebook and WhatsApp groups.
          </p>
          <form
            className="mt-8 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/marketplace", search: { q: q || undefined } });
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search AdSense blogs, stores, portals…"
                className="h-12 bg-card pl-9 text-foreground"
                aria-label="Search listings"
              />
            </div>
            <Button type="submit" size="lg" className="h-12">
              Search
            </Button>
          </form>
          <div className="mt-6 flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/marketplace"
                search={{ category: c.id }}
                className="rounded-full border border-navy-2 px-3 py-1 text-sm text-navy-muted hover:border-primary hover:text-primary"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">Featured listings</h2>
          <Link
            to="/marketplace"
            className="text-sm font-medium text-accent-foreground hover:text-primary"
          >
            View all →
          </Link>
        </div>
        <p className="mb-5 text-xs text-muted-foreground">
          Original sample listings are marked as examples. Real listings are reviewed before
          publication.
        </p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Handshake,
                t: "1. Agree a deal",
                d: "Make an offer, bid, or buy now. A private deal room opens for buyer and seller.",
              },
              {
                icon: Wallet,
                t: "2. Pay into escrow",
                d: "Pay by JazzCash, Easypaisa, Raast, bank transfer or USDT. Our team verifies it by hand and holds it.",
              },
              {
                icon: BadgeCheck,
                t: "3. Transfer & release",
                d: "The seller hands over the website, hosting and accounts. Once you confirm, funds are released.",
              },
            ].map((s) => (
              <div key={s.t} className="rounded-xl border p-6">
                <s.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">{s.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 text-sm sm:grid-cols-3">
            {[
              [ShieldCheck, "Funds held until approval"],
              [BadgeCheck, "AdSense & Analytics verification"],
              [Lock, "Private, encrypted deal rooms"],
            ].map(([I, t]) => {
              const Icon = I as typeof Lock;
              return (
                <div key={t as string} className="flex items-center gap-2 font-medium">
                  <Icon className="h-5 w-5 text-primary" />
                  {t as string}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="mb-6 text-2xl font-bold">Recently listed</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="mb-4 text-2xl font-bold">Frequently asked</h2>
        <Accordion type="single" collapsible>
          {faqs.slice(0, 4).map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </SiteLayout>
  );
}
