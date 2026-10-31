import { Link } from "@tanstack/react-router";
import { Pkr } from "@/hooks/use-pkr-rate";
import { BadgeCheck, Gavel } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { categories, compact, publicStatusLabel, usd, type Listing } from "@/lib/listings";

export function ListingCard({ l }: { l: Listing }) {
  const cat = categories.find((c) => c.id === l.category)?.label;
  return (
    <Link
      to="/listing/$id"
      params={{ id: l.id }}
      className="group flex flex-col rounded-xl border bg-card p-5 shadow-card transition hover:-translate-y-0.5 hover:border-primary"
    >
      {l.imageUrls?.[0] && (
        <img
          src={l.imageUrls[0]}
          alt={l.title}
          loading="lazy"
          width={480}
          height={270}
          className="mb-4 aspect-video w-full rounded-md object-cover"
        />
      )}
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge variant="secondary">{cat}</Badge>
        {l.status !== "active" ? (
          <Badge variant={l.status === "sold" ? "secondary" : "warning"}>
            {publicStatusLabel[l.status]}
          </Badge>
        ) : l.type === "auction" ? (
          <Badge className="gap-1">
            <Gavel className="h-3 w-3" /> Auction
          </Badge>
        ) : null}
      </div>
      {l.sellerId === null && (
        <span className="mb-2 text-xs text-muted-foreground">Example listing · browse only</span>
      )}
      <h3 className="font-semibold leading-snug group-hover:text-primary">{l.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{l.summary}</p>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Metric k="Revenue/mo" v={usd(l.monthlyRevenue)} />
        <Metric k="Profit/mo" v={usd(l.monthlyProfit)} />
        <Metric k="Traffic/mo" v={compact(l.monthlyTraffic)} />
      </dl>
      <div className="mt-5 flex items-end justify-between border-t pt-4">
        <div>
          <div className="text-xs text-muted-foreground">
            {l.type === "auction" ? "Current bid" : "Asking price"}
          </div>
          <div className="font-display text-xl font-bold">{usd(l.price)}</div>
          <Pkr usd={l.price} />
        </div>
        {l.seller.verified && (
          <span className="flex items-center gap-1 text-xs text-accent-foreground">
            <BadgeCheck className="h-4 w-4 text-primary" /> Verified seller
          </span>
        )}
      </div>
    </Link>
  );
}

function Metric({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1.5">
      <dt className="text-muted-foreground">{k}</dt>
      <dd className="font-semibold">{v}</dd>
    </div>
  );
}
