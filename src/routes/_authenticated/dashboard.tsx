import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { paymentMethods, type PaymentMethodId } from "@/lib/payment-methods";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useAccountType } from "@/hooks/use-account-type";
import { useState } from "react";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Pencil,
  ArrowUpRight,
  LayoutDashboard,
  Store,
  Handshake,
  MessageSquare,
  Gavel,
  Heart,
  LifeBuoy,
  Settings,
  Bell,
  ShieldCheck,
} from "lucide-react";
import { dashboardQuery } from "@/lib/marketplace.queries";
import { marketplaceCommand } from "@/lib/marketplace.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/site/FormField";
import { usd } from "@/lib/listings";
import { stageLabels } from "@/lib/workflow";
import { pageMeta } from "@/lib/seo";
import {
  NotificationBell,
  NotificationList,
  buildNotifications,
  useReadNotifications,
} from "@/components/site/NotificationCenter";
export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardQuery),
  head: () =>
    pageMeta(
      "My account",
      "Your ClicksSpot listings, offers, bids, saved assets and private deals.",
    ),
  component: Dashboard,
});
function Dashboard() {
  const { data } = useSuspenseQuery(dashboardQuery);
  const [selectedTab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  async function command(input: Parameters<typeof marketplaceCommand>[0]["data"]) {
    setBusy(true);
    try {
      const result = await marketplaceCommand({ data: input });
      await queryClient.invalidateQueries();
      toast.success("Updated");
      if (
        ((input.kind === "respond" && input.accept) || input.kind === "close_auction") &&
        typeof result === "string"
      )
        await navigate({ to: "/deal/$id", params: { id: result } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
    } finally {
      setBusy(false);
    }
  }
  const activeDeals = data.deals.filter(
    (d) => !["completed", "refunded", "cancelled"].includes(d.stage),
  ).length;
  const pendingOffers = data.offers.filter((o) => o.status === "pending").length;
  const notifications = buildNotifications(data.userId, data.offers, data.deals, data.tickets);
  const notif = useReadNotifications();
  const unreadCount = notifications.filter((n) => !notif.read.includes(n.id)).length;
  const account = useAccountType();
  const isSeller = (account.type ?? data.profile.account_type) === "seller";
  const tab = !isSeller && selectedTab === "Listings" ? "Overview" : selectedTab;
  const sellerOnly = ["Listings"];
  const menuAll = [
    { id: "Overview", icon: LayoutDashboard, count: undefined },
    { id: "Notifications", icon: Bell, count: unreadCount },
    { id: "Listings", icon: Store, count: data.listings.length },
    { id: "Deals", icon: Handshake, count: activeDeals },
    { id: "Offers", icon: MessageSquare, count: pendingOffers },
    { id: "Bids", icon: Gavel, count: data.bids.length },
    { id: "Saved", icon: Heart, count: data.watchlist.length },
    { id: "Support", icon: LifeBuoy, count: data.tickets.length },
    { id: "Settings", icon: Settings, count: undefined },
  ];
  const menu = menuAll.filter((m) => isSeller || !sellerOnly.includes(m.id));
  const stats = [
    isSeller
      ? { label: "My listings", value: data.listings.length, icon: Store, to: "Listings" }
      : { label: "My bids", value: data.bids.length, icon: Gavel, to: "Bids" },
    { label: "Active deals", value: activeDeals, icon: Handshake, to: "Deals" },
    { label: "Pending offers", value: pendingOffers, icon: MessageSquare, to: "Offers" },
    { label: "Saved assets", value: data.watchlist.length, icon: Heart, to: "Saved" },
  ];
  const initial = data.profile.display_name?.charAt(0).toUpperCase() ?? "U";
  return (
    <SiteLayout>
      <div className="bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{data.profile.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {data.isAdmin ? "Administrator · " : ""}
                    {isSeller ? "Seller account" : "Buyer account"}
                  </p>
                </div>
              </div>
              <nav
                aria-label="Dashboard"
                className="mt-3 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
              >
                {menu.map((m) => {
                  const active = tab === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setTab(m.id)}
                      aria-current={active ? "page" : undefined}
                      className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <m.icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{m.id}</span>
                      {m.count !== undefined && m.count > 0 && (
                        <span
                          className={`rounded-full px-2 text-xs ${active ? "bg-primary-foreground/20" : "bg-muted"}`}
                        >
                          {m.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
              <div className="mt-4 hidden space-y-2 border-t pt-4 lg:block">
                <Button asChild className="w-full">
                  {isSeller ? (
                    <Link to="/sell">
                      <Plus />
                      New listing
                    </Link>
                  ) : (
                    <Link to="/marketplace">Browse websites</Link>
                  )}
                </Button>
                {data.isAdmin && (
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/admin">
                      <ShieldCheck />
                      Administration
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </aside>
          <section className="min-w-0 rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  Dashboard
                </p>
                <h1 className="text-2xl md:text-3xl">
                  {tab === "Overview" ? `Welcome, ${data.profile.display_name}` : tab}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <NotificationBell items={notifications} onTab={setTab} {...notif} />
                <Button asChild size="sm" className="lg:hidden">
                  {isSeller ? (
                    <Link to="/sell">
                      <Plus />
                      New listing
                    </Link>
                  ) : (
                    <Link to="/marketplace">Browse websites</Link>
                  )}
                </Button>
              </div>
            </div>
            {tab === "Notifications" && (
              <div>
                <div className="mb-3 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={unreadCount === 0}
                    onClick={() => notif.markAll(notifications.map((n) => n.id))}
                  >
                    Mark all as read
                  </Button>
                </div>
                <div className="overflow-hidden rounded-lg border">
                  <NotificationList
                    items={notifications}
                    read={notif.read}
                    onOpen={notif.markRead}
                    onTab={setTab}
                    loading={notif.loading}
                  />
                </div>
              </div>
            )}
            {tab === "Overview" && (
              <div className="space-y-8">
                {!isSeller && (
                  <div className="rounded-xl border bg-background p-5">
                    <h2 className="text-lg">How buying works</h2>
                    <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      {[
                        ["1. Find a website", "Browse verified listings and save favourites."],
                        ["2. Offer or bid", "Make an offer, bid in an auction or buy now."],
                        ["3. Pay safely", "Pay ClicksSpot by JazzCash, Easypaisa, bank, Raast or USDT."],
                        ["4. Receive transfer", "The seller hands over the site in your deal room."],
                        ["5. Approve", "Check everything, then approve to release payment."],
                      ].map(([t, d]) => (
                        <li key={t} className="rounded-lg border bg-card p-3">
                          <p className="text-sm font-semibold text-heading">{t}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{d}</p>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild>
                        <Link to="/marketplace">Browse websites</Link>
                      </Button>
                      <Button variant="outline" onClick={() => setTab("Saved")}>
                        My saved websites
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {stats.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => setTab(s.to)}
                      className="rounded-xl border bg-background p-5 text-left transition-colors hover:border-primary"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                        <s.icon className="h-4 w-4" />
                      </span>
                      <p className="mt-4 text-3xl font-semibold">{s.value}</p>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <h2 className="mb-2 text-lg">Recent deals</h2>
                  {data.deals.length === 0 ? (
                    <Empty text="Your private deal rooms will appear here." />
                  ) : (
                    data.deals.slice(0, 4).map((d) => (
                      <div
                        key={d.id}
                        className="activity-row flex items-center justify-between gap-4"
                      >
                        <div>
                          <p className="font-medium">{d.listings?.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {usd(Number(d.amount))} · {stageLabels[d.stage]}
                          </p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                          <Link to="/deal/$id" params={{ id: d.id }}>
                            Open
                            <ArrowUpRight />
                          </Link>
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            {tab === "Listings" && (
              <div>
                {data.listings.length === 0 ? (
                  <Empty text="You haven’t listed an asset yet." />
                ) : (
                  data.listings.map((l) => (
                    <div
                      key={l.id}
                      className="activity-row flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <h2 className="text-lg">{l.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {usd(Number(l.price))} · {l.sale_type}{" "}
                          <span className="status-pill ml-2">{l.status}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {["draft", "pending", "rejected"].includes(l.status) ? (
                          <>
                            <Button asChild variant="outline" size="sm">
                              <Link to="/listing-edit/$id" params={{ id: l.id }}>
                                <Pencil />
                                Edit
                              </Link>
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              title="Delete listing"
                              aria-label={`Delete ${l.title}`}
                              disabled={busy}
                              onClick={() => {
                                if (window.confirm("Delete this listing?"))
                                  command({ kind: "delete_listing", id: l.id });
                              }}
                            >
                              <Trash2 />
                            </Button>
                          </>
                        ) : (
                          <Button asChild variant="outline" size="sm">
                            <Link to="/listing/$id" params={{ id: l.slug }}>
                              View
                              <ArrowUpRight />
                            </Link>
                          </Button>
                        )}
                        {l.sale_type === "auction" &&
                          l.status === "approved" &&
                          l.ends_at &&
                          new Date(l.ends_at).getTime() < Date.now() && (
                            <Button
                              onClick={() => command({ kind: "close_auction", id: l.id })}
                              disabled={busy}
                            >
                              Close auction
                            </Button>
                          )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "Deals" && (
              <div>
                {data.deals.length === 0 ? (
                  <Empty text="Your private deal rooms will appear here." />
                ) : (
                  data.deals.map((d) => (
                    <div
                      key={d.id}
                      className="activity-row flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <h2 className="text-lg">{d.listings?.title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {d.buyer_id === data.userId ? "Buying" : "Selling"} ·{" "}
                          {usd(Number(d.amount))} · {stageLabels[d.stage]}
                        </p>
                      </div>
                      <Button asChild variant="outline">
                        <Link to="/deal/$id" params={{ id: d.id }}>
                          Open deal room
                          <ArrowUpRight />
                        </Link>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "Offers" && (
              <div>
                {data.offers.length === 0 ? (
                  <Empty text="No offers yet." />
                ) : (
                  data.offers.map((o) => (
                    <div
                      key={o.id}
                      className="activity-row flex flex-wrap items-start justify-between gap-4"
                    >
                      <div>
                        <h2 className="text-lg">{o.listings?.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          {o.buyer_id === data.userId ? "Your offer" : "Received offer"} ·{" "}
                          {usd(Number(o.amount))} · {o.status}
                        </p>
                        <p className="mt-2 text-sm">{o.message}</p>
                      </div>
                      {o.status === "pending" && (
                        <div className="flex gap-2">
                          {o.buyer_id === data.userId ? (
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => command({ kind: "withdraw", id: o.id })}
                            >
                              Withdraw
                            </Button>
                          ) : (
                            <>
                              <Button
                                disabled={busy}
                                onClick={() => command({ kind: "respond", id: o.id, accept: true })}
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                disabled={busy}
                                onClick={() =>
                                  command({ kind: "respond", id: o.id, accept: false })
                                }
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "Bids" && (
              <div>
                {data.bids.length === 0 ? (
                  <Empty text="No auction bids yet." />
                ) : (
                  data.bids.map((b) => (
                    <div
                      key={b.id}
                      className="activity-row flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <h2 className="text-lg">{b.listings?.title}</h2>
                        <p className="text-sm text-muted-foreground">
                          Your bid: {usd(Number(b.amount))} ·{" "}
                          {new Date(b.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {b.listings?.status === "approved" &&
                      b.listings.ends_at &&
                      new Date(b.listings.ends_at).getTime() < Date.now() ? (
                        <Button
                          disabled={busy}
                          onClick={() => command({ kind: "close_auction", id: b.listing_id })}
                        >
                          Claim winning bid
                        </Button>
                      ) : (
                        <Button asChild variant="outline">
                          <Link to="/listing/$id" params={{ id: b.listings?.slug ?? "" }}>
                            View auction
                          </Link>
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "Saved" && (
              <div>
                {data.watchlist.length === 0 ? (
                  <Empty text="No saved listings yet." />
                ) : (
                  data.watchlist.map((w) => (
                    <div
                      key={w.listing_id}
                      className="activity-row flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <h2 className="text-lg">
                          {w.listings?.title ?? "Listing no longer public"}
                        </h2>
                        <p className="text-muted-foreground">
                          {w.listings ? usd(Number(w.listings.price)) : ""}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {w.listings && (
                          <Button asChild variant="outline">
                            <Link to="/listing/$id" params={{ id: w.listings.slug }}>
                              View
                            </Link>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          disabled={busy}
                          onClick={() => command({ kind: "watch", id: w.listing_id, saved: false })}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {tab === "Support" && (
              <div>
                {data.tickets.length === 0 ? (
                  <Empty text="No support requests yet." />
                ) : (
                  data.tickets.map((t) => (
                    <div key={t.id} className="activity-row">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg">{t.subject}</h2>
                        <span className="status-pill">{t.status}</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{t.body}</p>
                      {t.reply && (
                        <p className="mt-4 border-l-2 border-primary pl-4 text-sm">
                          ClicksSpot: {t.reply}
                        </p>
                      )}
                    </div>
                  ))
                )}
                <Button asChild variant="outline" className="mt-6">
                  <Link to="/contact">Contact support</Link>
                </Button>
              </div>
            )}
            {tab === "Settings" && (
              <div className="mb-8 max-w-xl rounded-xl border bg-background p-5">
                <h2 className="text-xl">Account type</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isSeller
                    ? "You have a seller account: you can list assets and also buy."
                    : "You have a buyer account: you can make offers, bid and buy. Switch to a seller account to list your own assets."}
                </p>
                <Button
                  className="mt-4"
                  variant={isSeller ? "outline" : "default"}
                  disabled={account.switching || account.loading || !!account.error}
                  onClick={() => account.setType(isSeller ? "buyer" : "seller")}
                >
                  {account.switching ? "Switching…" : isSeller ? "Switch to buyer account" : "Switch to seller account"}
                </Button>
                {account.error && (
                  <p role="alert" className="mt-3 text-sm text-destructive">
                    Could not load your account type.
                    <Button variant="link" size="sm" onClick={() => account.retry()}>Try again</Button>
                  </p>
                )}
              </div>
            )}
            {tab === "Settings" && (
              <form
                className="max-w-xl space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  command({
                    kind: "profile",
                    name: String(f.get("name")),
                    bio: String(f.get("bio")),
                    method: String(f.get("method")) as PaymentMethodId,
                    account: String(f.get("account")),
                  });
                }}
              >
                <h2 className="text-xl">Profile & seller payout</h2>
                <FormField label="Display name">
                  <Input
                    name="name"
                    aria-label="Display name"
                    defaultValue={data.profile.display_name}
                    required
                    minLength={2}
                  />
                </FormField>
                <FormField label="Bio">
                  <Textarea name="bio" aria-label="Bio" defaultValue={data.profile.bio ?? ""} />
                </FormField>
                <FormField label="Payout method">
                  <select
                    name="method"
                    aria-label="Payout method"
                    className="native-select"
                    defaultValue={data.payout?.method ?? "binance_pay"}
                  >
                    {paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Payout account or address">
                  <Input
                    name="account"
                    aria-label="Payout account or address"
                    required
                    minLength={3}
                    defaultValue={data.payout?.account ?? ""}
                  />
                </FormField>
                <p className="text-sm text-muted-foreground">
                  Payout details are private to you and ClicksSpot administrators.
                </p>
                <Button type="submit" disabled={busy}>
                  Save settings
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="py-12 text-muted-foreground">{text}</p>;
}
