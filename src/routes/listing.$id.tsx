import { useCurrency } from "@/hooks/use-currency";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Flag, Heart, Share2, Gavel, Globe, ShieldCheck, Mail, Phone, Landmark, Star, MapPin, CalendarDays } from "lucide-react";
import type { Listing } from "@/lib/listings";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ListingCard } from "@/components/site/ListingCard";
import { FormField } from "@/components/site/FormField";
import { categories, compact, publicStatusLabel, usd } from "@/lib/listings";
import { marketplaceQuery, dashboardQuery } from "@/lib/marketplace.queries";
import { marketplaceCommand } from "@/lib/marketplace.functions";
import { useSession } from "@/hooks/use-session";
import { pageMeta } from "@/lib/seo";
export const Route = createFileRoute("/listing/$id")({
  loader: async ({ params, context }) => {
    const listings = await context.queryClient.ensureQueryData(marketplaceQuery);
    const listing = listings.find((l) => l.id === params.id);
    if (!listing) throw notFound();
    return { listing };
  },
  head: ({ loaderData }) => {
    const l = loaderData?.listing;
    return l
      ? pageMeta(`${l.title} — ${usd(l.price)}`, l.summary)
      : pageMeta("Listing unavailable", "This ClicksSpot listing is unavailable.");
  },
  notFoundComponent: () => (
    <SiteLayout>
      <div className="workspace">
        <h1 className="text-3xl">Listing not found</h1>
        <Button asChild className="mt-6">
          <Link to="/marketplace">Back to marketplace</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
  component: ListingPage,
});
function ListingPage() {
  useCurrency();
  const { id } = Route.useParams();
  const { data: listings } = useSuspenseQuery(marketplaceQuery);
  const l = listings.find((x) => x.id === id);
  const { user } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: account } = useQuery({ ...dashboardQuery, enabled: Boolean(user) });
  const [dialog, setDialog] = useState<"buy" | "offer" | "bid" | "report" | null>(null);
  const [busy, setBusy] = useState(false);
  if (!l) return null;
  const listingId = l.databaseId;
  const saved = account?.watchlist.some((w) => w.listing_id === listingId) ?? false;
  const owner = user?.id === l.sellerId;
  const expired = l.endsAt && new Date(l.endsAt).getTime() <= Date.now();
  async function submit(input: Parameters<typeof marketplaceCommand>[0]["data"]) {
    setBusy(true);
    try {
      const result = await marketplaceCommand({ data: input });
      await queryClient.invalidateQueries();
      setDialog(null);
      if (input.kind === "buy" && typeof result === "string")
        await navigate({ to: "/deal/$id", params: { id: result } });
      else
        toast.success(
          input.kind === "watch"
            ? input.saved
              ? "Saved to your watchlist"
              : "Removed from watchlist"
            : input.kind === "bid"
              ? "Bid placed"
              : input.kind === "report"
                ? "Report submitted"
                : "Offer sent",
        );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  const similar = listings.filter((x) => x.category === l.category && x.id !== l.id).slice(0, 3);
  const others = l.sellerId ? listings.filter((x) => x.sellerId === l.sellerId && x.id !== l.id) : [];
  return (
    <SiteLayout>
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{categories.find((c) => c.id === l.category)?.label}</Badge>
            <Badge variant="outline">{publicStatusLabel[l.status]}</Badge>
            {l.verified.map((v) => (
              <Badge key={v} className="gap-1">
                <BadgeCheck className="h-3 w-3" />
                {v} verified
              </Badge>
            ))}
          </div>
          <div>
            <h1 className="text-3xl">{l.title}</h1>
            <p className="mt-3 text-muted-foreground">{l.summary}</p>
          </div>
          {l.imageUrls?.length ? (
            <div className="space-y-3">
              <img
                src={l.imageUrls[0]}
                alt={l.title}
                width={900}
                height={506}
                className="aspect-video w-full rounded-md object-cover"
              />
              {l.imageUrls.length > 1 && (
                <div className="grid grid-cols-3 gap-3">
                  {l.imageUrls.slice(1).map((url, i) => (
                    <img
                      key={url}
                      src={url}
                      alt={`${l.title} image ${i + 2}`}
                      width={300}
                      height={169}
                      className="aspect-video rounded-md object-cover"
                      loading="lazy"
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="listing-monogram aspect-video rounded-md" aria-label="Asset category">
              <Globe className="h-20 w-20" />
            </div>
          )}
          <dl className="grid grid-cols-2 gap-3 border-y py-5 md:grid-cols-4">
            {[
              ["Monthly revenue", usd(l.monthlyRevenue)],
              ["Monthly profit", usd(l.monthlyProfit)],
              ["Monthly traffic", compact(l.monthlyTraffic)],
              ["Age", `${l.ageYears} years`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="mt-1 text-lg">{v}</dd>
              </div>
            ))}
          </dl>
          <section>
            <h2 className="text-xl">About this asset</h2>
            <p className="mt-4 whitespace-pre-wrap leading-relaxed text-muted-foreground">
              {l.description}
            </p>
            {l.url && (
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-accent-foreground"
              >
                <Globe className="h-4 w-4" />
                Visit asset website
              </a>
            )}
          </section>
        </div>
        <aside className="space-y-6">
          <div className="rounded-md border bg-card p-6 shadow-card lg:sticky lg:top-20">
            <p className="text-sm text-muted-foreground">
              {l.type === "auction" ? "Highest bid / starting price" : "Asking price"}
            </p>
            <p className="mt-1 text-3xl">{usd(l.price)}</p>
            {l.sellerId && (
              <p className="mt-3 text-xs text-muted-foreground">
                Seller:{" "}
                {l.seller.reviews
                  ? `${l.seller.rating}/5 · ${l.seller.reviews} reviews`
                  : "No reviews yet"}{" "}
                · {l.seller.deals} completed deals
              </p>
            )}
            {l.endsAt && (
              <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                <Gavel className="h-4 w-4" />
                {expired ? "Auction ended" : `Ends ${new Date(l.endsAt).toLocaleString()}`} ·{" "}
                {l.bidCount ?? 0} bids
              </p>
            )}
            {l.sellerId === null ? (
              <p className="mt-5 rounded-md bg-muted p-3 text-sm">
                Example listing · browse only. This sample is not offered for purchase.
              </p>
            ) : owner ? (
              <p className="mt-5 text-sm text-muted-foreground">
                This is your listing. Manage offers from your account.
              </p>
            ) : !user ? (
              <Button asChild className="mt-5 w-full">
                <Link to="/auth" search={{ redirect: `/listing/${l.id}` }}>
                  Sign in to {l.type === "auction" ? "bid" : "buy or make an offer"}
                </Link>
              </Button>
            ) : l.status === "active" && !expired ? (
              <div className="mt-5 space-y-2">
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={() => setDialog(l.type === "auction" ? "bid" : "buy")}
                >
                  {l.type === "auction" ? "Place a bid" : "Buy now"}
                </Button>
                {l.type === "fixed" && (
                  <Button className="w-full" variant="outline" onClick={() => setDialog("offer")}>
                    Make an offer
                  </Button>
                )}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                {expired
                  ? "Bidding is closed."
                  : `This listing is ${publicStatusLabel[l.status].toLowerCase()}.`}
              </p>
            )}
            <div className="mt-5 flex justify-between gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={!user || busy}
                onClick={() => {
                  if (listingId) submit({ kind: "watch", id: listingId, saved: !saved });
                }}
              >
                <Heart className={saved ? "fill-primary" : ""} />
                {saved ? "Saved" : "Watch"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(window.location.href);
                    toast.success("Link copied");
                  } catch {
                    toast.error("Could not copy the link. Copy it from your address bar.");
                  }
                }}
              >
                <Share2 />
                Share
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!user}
                onClick={() => setDialog("report")}
              >
                <Flag />
                Report
              </Button>
            </div>
            <p className="mt-4 border-t pt-4 text-xs text-muted-foreground">
              JazzCash, Easypaisa, Raast, bank transfer or USDT. Payment proof is checked manually by ClicksSpot before the asset
              transfer.
            </p>
          </div>
          <SellerCard listing={l} others={others} />
        </aside>
      </div>
      {similar.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <h2 className="mb-5 text-2xl">Similar listings</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((x) => (
              <ListingCard key={x.id} l={x} />
            ))}
          </div>
        </section>
      )}
      <Dialog open={dialog !== null} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "buy"
                ? "Confirm your purchase"
                : dialog === "bid"
                  ? "Place an auction bid"
                  : dialog === "report"
                    ? "Report this listing"
                    : "Make an offer"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "buy"
                ? `Agree to ${usd(l.price)}. Payment is handled in your private deal room.`
                : dialog === "bid"
                  ? `Your bid must meet ${usd(l.price)} and exceed any existing bid.`
                  : dialog === "report"
                    ? "Your report is private to you and ClicksSpot administrators."
                    : "The seller will review your price and message."}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              if (!listingId || !dialog) return;
              const f = new FormData(e.currentTarget);
              if (dialog === "buy") submit({ kind: "buy", id: listingId });
              if (dialog === "offer")
                submit({
                  kind: "offer",
                  id: listingId,
                  amount: Number(f.get("amount")),
                  message: String(f.get("message")),
                });
              if (dialog === "bid")
                submit({ kind: "bid", id: listingId, amount: Number(f.get("amount")) });
              if (dialog === "report")
                submit({ kind: "report", id: listingId, reason: String(f.get("reason")) });
            }}
          >
            {(dialog === "offer" || dialog === "bid") && (
              <FormField label="Amount ($)">
                <Input
                  name="amount"
                  aria-label="Amount"
                  type="number"
                  min={dialog === "bid" ? l.price : 0.01}
                  step=".01"
                  required
                  defaultValue={l.price}
                />
              </FormField>
            )}
            {dialog === "offer" && (
              <FormField label="Message">
                <Textarea name="message" aria-label="Offer message" maxLength={1000} />
              </FormField>
            )}
            {dialog === "report" && (
              <FormField label="Reason">
                <Textarea
                  name="reason"
                  aria-label="Report reason"
                  required
                  minLength={5}
                  maxLength={2000}
                />
              </FormField>
            )}
            <Button disabled={busy} type="submit">
              {busy ? "Submitting…" : dialog === "buy" ? "Confirm & open deal room" : "Submit"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}

function SellerCard({ listing: l, others }: { listing: Listing; others: Listing[] }) {
  const s = l.seller;
  const sample = l.sellerId === null;
  const initials = s.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  const since = s.memberSince
    ? new Date(s.memberSince).toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : null;
  const checks = [
    { label: "ID verified", on: sample ? s.verified : Boolean(s.idVerified), icon: ShieldCheck },
    { label: "Email verified", on: !sample, icon: Mail },
    { label: "Phone verified", on: Boolean(s.phoneVerified), icon: Phone },
    { label: "Payment method verified", on: Boolean(s.paymentVerified), icon: Landmark },
  ];
  return (
    <div className="border-t pt-5">
      <h2 className="text-lg">About the seller</h2>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">
          {initials || "?"}
        </div>
        <div className="min-w-0">
          <p className="flex items-center gap-1 truncate font-medium">
            {s.name}
            {(sample ? s.verified : s.idVerified) && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
            {s.country && (<span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.country}</span>)}
            {since && (<span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />Member since {since}</span>)}
            {sample && <span>Sample seller profile</span>}
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-md bg-muted p-2">
          <p className="flex items-center justify-center gap-1 font-semibold">
            <Star className="h-4 w-4 text-primary" />{s.reviews ? s.rating.toFixed(1) : "—"}
          </p>
          <p className="text-xs text-muted-foreground">{s.reviews} reviews</p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <p className="font-semibold">{s.deals}</p>
          <p className="text-xs text-muted-foreground">completed deals</p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-sm">
        {checks.map((c) => (
          <li key={c.label} className={`flex items-center gap-2 ${c.on ? "" : "text-muted-foreground"}`}>
            <c.icon className={`h-4 w-4 ${c.on ? "text-primary" : ""}`} />
            {c.label}
            <span className="ml-auto text-xs">{c.on ? "Yes" : "Not yet"}</span>
          </li>
        ))}
      </ul>
      {others.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase text-muted-foreground">More from this seller</p>
          <ul className="mt-2 space-y-1 text-sm">
            {others.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link to="/listing/$id" params={{ id: o.id }} className="hover:underline">{o.title}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4 flex gap-2 rounded-md border bg-accent p-3 text-xs text-accent-foreground">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        Your payment is held by ClicksSpot escrow until you confirm the transfer. Never pay a seller directly.
      </div>
    </div>
  );
}
