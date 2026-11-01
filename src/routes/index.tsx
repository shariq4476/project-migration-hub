import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShieldCheck, Handshake, Wallet, BadgeCheck, Lock, Quote, MessagesSquare, LifeBuoy, UserCheck, ArrowRight } from "lucide-react";
import { useSiteContent } from "@/hooks/use-site-content";
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
import { categories } from "@/lib/listings";
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
  const c = useSiteContent();
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
        <div className="relative mx-auto max-w-7xl px-4 py-20 md:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-navy-2 px-3 py-1 text-xs text-navy-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {c.heroBadge}
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-navy-foreground md:text-6xl">
            {c.heroTitle}{" "}
            <span className="block text-primary">{c.heroHighlight}</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-navy-muted md:text-xl">{c.heroSubtitle}</p>
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

      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 md:grid-cols-4">
          {c.stats.map((s) => (
            <div key={s.text} className="text-center">
              <p className="font-display text-3xl font-extrabold text-primary md:text-4xl">{s.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-3xl font-bold">Featured listings</h2>
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
        <div className="mx-auto max-w-7xl px-4 py-20">
          <h2 className="text-3xl font-bold">How it works</h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">Three simple steps, with your money protected the whole way.</p>
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

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-3xl font-bold">Browse by category</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const count = listings.filter((l) => l.category === cat.id && l.status === "active").length;
            return (
              <Link key={cat.id} to="/marketplace" search={{ category: cat.id }} className="group flex items-center justify-between rounded-xl border bg-card p-5 shadow-card transition hover:border-primary">
                <div>
                  <p className="font-semibold group-hover:text-primary">{cat.label}</p>
                  <p className="text-sm text-muted-foreground">{count} live listing{count === 1 ? "" : "s"}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y bg-card">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <h2 className="text-3xl font-bold">Why buyers and sellers choose {c.siteName}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {c.features.map((f, i) => {
              const Icon = [BadgeCheck, ShieldCheck, Wallet, MessagesSquare, UserCheck, LifeBuoy][i % 6] ?? BadgeCheck;
              return (
                <div key={f.title} className="rounded-xl border bg-background p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-accent"><Icon className="h-5 w-5 text-primary" /></span>
                  <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="mb-8 text-3xl font-bold">Recently listed</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((l) => (
            <ListingCard key={l.id} l={l} />
          ))}
        </div>
      </section>

      <section className="bg-hero text-navy-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold text-navy-foreground md:text-4xl">{c.sellerTitle}</h2>
            <p className="mt-4 text-lg text-navy-muted">{c.sellerText}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg"><Link to="/sell">List your website</Link></Button>
              <Button asChild size="lg" variant="outline"><Link to="/fees">See fees</Link></Button>
            </div>
          </div>
          <div className="grid gap-4">
            {c.testimonials.map((t) => (
              <figure key={t.title} className="rounded-xl border border-navy-2 p-5">
                <Quote className="h-5 w-5 text-primary" />
                <blockquote className="mt-2 text-navy-foreground">{t.text}</blockquote>
                <figcaption className="mt-3 text-sm text-navy-muted">— {t.title}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="mb-6 text-3xl font-bold">Frequently asked</h2>
        <Accordion type="single" collapsible>
          {faqs.slice(0, 4).map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20">
        <div className="rounded-2xl border bg-accent p-10 text-center md:p-14">
          <h2 className="text-3xl font-bold">{c.ctaTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{c.ctaText}</p>
          <Button asChild size="lg" className="mt-8"><Link to="/marketplace">Browse listings</Link></Button>
        </div>
      </section>
    </SiteLayout>
  );
}
