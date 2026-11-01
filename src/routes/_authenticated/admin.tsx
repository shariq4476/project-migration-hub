import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Store,
  Handshake,
  Flag,
  LifeBuoy,
  Users,
  Settings,
  ArrowUpRight,
  Trash2,
  ShieldCheck,
  Search,
  History,
  Download,
  Ban,
  RotateCcw,
  TrendingUp,
  Palette,
} from "lucide-react";
import { SiteContentEditor } from "@/components/site/SiteContentEditor";
import { adminQuery } from "@/lib/marketplace.queries";
import { adminCommand } from "@/lib/marketplace.functions";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/site/FormField";
import { usd } from "@/lib/listings";
import { stageLabels } from "@/lib/workflow";
import { pageMeta } from "@/lib/seo";
import { stageTone, statusTone, toCsv } from "@/lib/admin-ui";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminQuery),
  head: () =>
    pageMeta(
      "Administration",
      "Review listings, manage users, private deal operations and support requests.",
    ),
  component: Admin,
  errorComponent: () => (
    <SiteLayout>
      <div className="workspace">
        <h1 className="text-3xl">Administrator access required</h1>
        <p className="mt-4 text-muted-foreground">
          Only an explicitly assigned administrator can access this area.
        </p>
        <Button asChild className="mt-6">
          <Link to="/dashboard">Back to my account</Link>
        </Button>
      </div>
    </SiteLayout>
  ),
});

const OPEN_STAGES = [
  "agreement",
  "payment_submitted",
  "payment_verified",
  "transferring",
  "delivered",
  "disputed",
];

function Admin() {
  const { data } = useSuspenseQuery(adminQuery);
  const [tab, setTab] = useState("Overview");
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const q = useQueryClient();
  async function command(input: Parameters<typeof adminCommand>[0]["data"]) {
    setBusy(true);
    try {
      await adminCommand({ data: input });
      await q.invalidateQueries();
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  const pendingListings = data.listings.filter((l) => l.status === "pending").length;
  const openDeals = data.deals.filter((d) => OPEN_STAGES.includes(d.stage)).length;
  const needsAction = data.deals.filter((d) =>
    ["payment_submitted", "disputed"].includes(d.stage),
  ).length;
  const payoutsDue = data.deals.filter((d) => d.stage === "completed" && !d.payout_paid_at).length;
  const openReports = data.reports.filter((r) => r.status === "open").length;
  const openTickets = data.tickets.filter((t) => t.status !== "resolved").length;
  const volume = data.deals
    .filter((d) => d.stage === "completed")
    .reduce((s, d) => s + Number(d.amount), 0);
  const revenue = data.deals
    .filter((d) => d.stage === "completed")
    .reduce((s, d) => s + Number(d.commission), 0);
  const menu = [
    { id: "Overview", icon: LayoutDashboard, count: 0 },
    { id: "Listings", icon: Store, count: pendingListings },
    { id: "Deals", icon: Handshake, count: needsAction + payoutsDue },
    { id: "Users", icon: Users, count: 0 },
    { id: "Reports", icon: Flag, count: openReports },
    { id: "Support", icon: LifeBuoy, count: openTickets },
    { id: "Activity", icon: History, count: 0 },
    { id: "Site content", icon: Palette, count: 0 },
    { id: "Settings", icon: Settings, count: 0 },
  ];
  const f = filter.trim().toLowerCase();
  const listings = data.listings.filter(
    (l) => !f || l.title.toLowerCase().includes(f) || l.status.includes(f),
  );
  const deals = data.deals.filter(
    (d) =>
      (stageFilter === "all" || d.stage === stageFilter) &&
      (!f || (d.listings?.title ?? "").toLowerCase().includes(f)),
  );
  const suspended = new Set(data.suspendedIds);
  const userName = new Map(data.users.map((u) => [u.id, u.display_name ?? u.email ?? "Member"]));
  const statusCounts = ["pending", "approved", "in_progress", "sold", "rejected", "suspended"].map(
    (st) => ({ label: st.replace("_", " "), n: data.listings.filter((l) => l.status === st).length, tone: statusTone(st) }),
  );
  const pipeline = OPEN_STAGES.map((st) => ({
    label: stageLabels[st as keyof typeof stageLabels],
    n: data.deals.filter((d) => d.stage === st).length,
    tone: stageTone(st),
  }));
  const since = Date.now() - 30 * 864e5;
  const newMembers30 = data.users.filter((u) => new Date(u.created_at).getTime() > since).length;
  const newListings30 = data.listings.filter((l) => new Date(l.created_at).getTime() > since).length;
  function download(name: string, rows: Record<string, unknown>[]) {
    const blob = new Blob([toCsv(rows)], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  const users = data.users.filter(
    (u) =>
      !f || u.display_name?.toLowerCase().includes(f) || (u.email ?? "").toLowerCase().includes(f),
  );

  return (
    <SiteLayout>
      <div className="bg-muted/40">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-3 border-b pb-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="font-semibold">Admin console</p>
                  <p className="text-xs text-muted-foreground">Full platform control</p>
                </div>
              </div>
              <nav
                aria-label="Administration"
                className="mt-3 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible"
              >
                {menu.map((m) => {
                  const active = tab === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-current={active ? "page" : undefined}
                      onClick={() => {
                        setTab(m.id);
                        setFilter("");
                      }}
                      className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-heading"
                      }`}
                    >
                      <m.icon className="h-4 w-4" aria-hidden="true" />
                      <span className="flex-1 text-left">{m.id}</span>
                      {m.count > 0 && (
                        <span
                          className={`rounded-full px-2 text-xs ${active ? "bg-primary-foreground/20" : "bg-destructive text-destructive-foreground"}`}
                        >
                          {m.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
              <Button asChild variant="outline" className="mt-4 hidden w-full lg:flex">
                <Link to="/dashboard">Back to my account</Link>
              </Button>
            </div>
          </aside>

          <section className="min-w-0 rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b pb-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  Administration
                </p>
                <h1 className="text-2xl md:text-3xl">{tab}</h1>
              </div>
              {["Listings", "Users", "Deals"].includes(tab) && (
                <div className="relative w-64">
                  <Search
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    className="pl-9"
                    placeholder={`Search ${tab.toLowerCase()}…`}
                    aria-label={`Search ${tab.toLowerCase()}`}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
              )}
            </div>

            {tab === "Overview" && (
              <div className="space-y-8">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <Stat label="Completed volume" value={usd(volume)} />
                  <Stat label="Commission earned" value={usd(revenue)} />
                  <Stat label="Open deals" value={openDeals} onClick={() => setTab("Deals")} />
                  <Stat label="Members" value={data.users.length} onClick={() => setTab("Users")} />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <MiniStat label="New members (30 days)" value={newMembers30} />
                  <MiniStat label="New listings (30 days)" value={newListings30} />
                  <MiniStat
                    label="Average deal size"
                    value={usd(
                      data.deals.length
                        ? data.deals.reduce((s, d) => s + Number(d.amount), 0) / data.deals.length
                        : 0,
                    )}
                  />
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <Bars title="Listings by status" rows={statusCounts} />
                  <Bars title="Open deal pipeline" rows={pipeline} />
                </div>
                <div>
                  <h2 className="mb-3 text-lg">Needs your attention</h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Todo
                      label="Listings awaiting review"
                      n={pendingListings}
                      go={() => setTab("Listings")}
                    />
                    <Todo
                      label="Payments to verify or disputes"
                      n={needsAction}
                      go={() => setTab("Deals")}
                    />
                    <Todo label="Seller payouts due" n={payoutsDue} go={() => setTab("Deals")} />
                    <Todo label="Open reports" n={openReports} go={() => setTab("Reports")} />
                    <Todo
                      label="Unanswered support requests"
                      n={openTickets}
                      go={() => setTab("Support")}
                    />
                  </div>
                </div>
              </div>
            )}

            {tab === "Listings" &&
              (listings.length === 0 ? (
                <Empty text="No listings match." />
              ) : (
                listings.map((l) => {
                  const review = data.reviews.find((r) => r.listing_id === l.id);
                  return (
                    <form
                      key={l.id}
                      className="activity-row space-y-4"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const fd = new FormData(e.currentTarget);
                        command({
                          kind: "moderate",
                          id: l.id,
                          status: String(fd.get("status")) as "approved",
                          note: String(fd.get("note")),
                          verified: fd.getAll("verified") as ("Domain" | "Analytics" | "Revenue")[],
                          featured: fd.get("featured") === "on",
                        });
                      }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="text-xl">{l.title}</h2>
                          <p className="text-sm text-muted-foreground">
                            {usd(Number(l.price))} · {l.url ?? "No URL"} ·{" "}
                            {l.seller_id ? "Seller account linked" : "Example listing"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="status-pill" data-tone={statusTone(l.status)}>{l.status.replace("_", " ")}</span>
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label={`View ${l.title}`}
                          >
                            <Link to="/listing/$id" params={{ id: l.slug }}>
                              <ArrowUpRight />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${l.title}`}
                            disabled={busy}
                            onClick={() =>
                              window.confirm(`Permanently delete "${l.title}"?`) &&
                              command({ kind: "delete_listing", id: l.id })
                            }
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                      {review && (
                        <div className="border-l-2 border-primary pl-4 text-sm">
                          <p>Ownership: {review.ownership_method}</p>
                          <p className="mt-1 break-words text-muted-foreground">
                            {review.ownership_evidence}
                          </p>
                        </div>
                      )}
                      {!["in_progress", "sold"].includes(l.status) && (
                        <>
                          <div className="form-grid">
                            <FormField label="Decision">
                              <select
                                name="status"
                                className="native-select"
                                defaultValue={
                                  ["approved", "rejected", "suspended"].includes(l.status)
                                    ? l.status
                                    : "approved"
                                }
                              >
                                <option value="approved">Approve</option>
                                <option value="rejected">Reject</option>
                                <option value="suspended">Suspend</option>
                              </select>
                            </FormField>
                            <FormField label="Review notes">
                              <Input name="note" defaultValue={review?.admin_note ?? ""} />
                            </FormField>
                          </div>
                          <div className="flex flex-wrap gap-5 text-sm">
                            {["Domain", "Analytics", "Revenue"].map((v) => (
                              <label key={v} className="flex items-center gap-2">
                                <input
                                  name="verified"
                                  type="checkbox"
                                  value={v}
                                  defaultChecked={l.verified.includes(v)}
                                />
                                {v} verified
                              </label>
                            ))}
                            <label className="flex items-center gap-2">
                              <input name="featured" type="checkbox" defaultChecked={l.featured} />
                              Featured
                            </label>
                          </div>
                          <Button type="submit" size="sm" disabled={busy}>
                            Save decision
                          </Button>
                        </>
                      )}
                    </form>
                  );
                })
              ))}

            {tab === "Deals" && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <select
                  aria-label="Filter by stage"
                  className="native-select w-56"
                  value={stageFilter}
                  onChange={(e) => setStageFilter(e.target.value)}
                >
                  <option value="all">All stages</option>
                  {Object.entries(stageLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    download(
                      "clicksspot-deals.csv",
                      deals.map((d) => ({
                        id: d.id,
                        asset: d.listings?.title,
                        buyer: userName.get(d.buyer_id),
                        seller: userName.get(d.seller_id),
                        amount: d.amount,
                        commission: d.commission,
                        stage: d.stage,
                        payout_paid_at: d.payout_paid_at,
                        created_at: d.created_at,
                      })),
                    )
                  }
                >
                  <Download /> Export CSV
                </Button>
              </div>
            )}
            {tab === "Deals" &&
              (deals.length === 0 ? (
                <Empty text="No deals match." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-3 pr-4 font-medium">Asset</th>
                        <th className="py-3 pr-4 font-medium">Buyer → Seller</th>
                        <th className="py-3 pr-4 font-medium">Amount</th>
                        <th className="py-3 pr-4 font-medium">Commission</th>
                        <th className="py-3 pr-4 font-medium">Stage</th>
                        <th className="py-3 pr-4 font-medium">Payout</th>
                        <th className="py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((d) => (
                        <tr key={d.id} className="border-b last:border-0">
                          <td className="py-3 pr-4 font-medium">{d.listings?.title}</td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {userName.get(d.buyer_id)} → {userName.get(d.seller_id)}
                          </td>
                          <td className="py-3 pr-4">{usd(Number(d.amount))}</td>
                          <td className="py-3 pr-4">{usd(Number(d.commission))}</td>
                          <td className="py-3 pr-4">
                            <span className="status-pill" data-tone={stageTone(d.stage)}>
                              {stageLabels[d.stage]}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-muted-foreground">
                            {d.payout_paid_at ? "Paid" : d.stage === "completed" ? "Due" : "—"}
                          </td>
                          <td className="py-3 text-right">
                            <Button asChild variant="outline" size="sm">
                              <Link to="/deal/$id" params={{ id: d.id }}>
                                Manage
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === "Users" && (
              <div className="mb-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    download(
                      "clicksspot-members.csv",
                      users.map((u) => ({
                        id: u.id,
                        name: u.display_name,
                        email: u.email,
                        joined: u.created_at,
                        listings: u.listings,
                        deals: u.deals,
                        roles: (u.roles ?? []).join(" "),
                        suspended: suspended.has(u.id),
                      })),
                    )
                  }
                >
                  <Download /> Export CSV
                </Button>
              </div>
            )}
            {tab === "Users" &&
              (users.length === 0 ? (
                <Empty text="No members match." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <tr className="border-b">
                        <th className="py-3 pr-4 font-medium">Member</th>
                        <th className="py-3 pr-4 font-medium">Joined</th>
                        <th className="py-3 pr-4 font-medium">Listings</th>
                        <th className="py-3 pr-4 font-medium">Deals</th>
                        <th className="py-3 pr-4 font-medium">Roles</th>
                        <th className="py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => {
                        const isAdmin = (u.roles ?? []).includes("admin");
                        const isMod = (u.roles ?? []).includes("moderator");
                        return (
                          <tr key={u.id} className="border-b last:border-0">
                            <td className="py-3 pr-4">
                              <p className="font-medium">{u.display_name}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </td>
                            <td className="py-3 pr-4">
                              {new Date(u.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 pr-4">{u.listings}</td>
                            <td className="py-3 pr-4">{u.deals}</td>
                            <td className="py-3 pr-4">
                              {suspended.has(u.id) && (
                                <span className="status-pill mr-1" data-tone="danger">suspended</span>
                              )}
                              {isAdmin && <span className="status-pill mr-1" data-tone="info">admin</span>}
                              {isMod && <span className="status-pill" data-tone="info">moderator</span>}
                              {!isAdmin && !isMod && !suspended.has(u.id) && (
                                <span className="text-muted-foreground">member</span>
                              )}
                              <div className="mt-2 flex flex-wrap gap-1">
                                {(["id", "phone", "payment"] as const).map((check) => {
                                  const v = data.verification.find((p) => p.id === u.id);
                                  const on = Boolean(v?.[`${check}_verified` as const]);
                                  return (
                                    <button
                                      key={check}
                                      type="button"
                                      disabled={busy}
                                      className="status-pill cursor-pointer"
                                      data-tone={on ? "success" : "neutral"}
                                      title={`${on ? "Remove" : "Mark"} ${check} verification`}
                                      onClick={() => command({ kind: "verify", id: u.id, check, value: !on })}
                                    >
                                      {on ? "✓ " : ""}
                                      {check === "id" ? "ID" : check === "phone" ? "Phone" : "Payment"}
                                    </button>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="space-x-2 whitespace-nowrap py-3 text-right">
                              <Button
                                size="sm"
                                variant={isAdmin ? "outline" : "default"}
                                disabled={busy || (isAdmin && u.id === data.userId)}
                                onClick={() =>
                                  window.confirm(
                                    `${isAdmin ? "Remove" : "Grant"} administrator access for ${u.display_name}?`,
                                  ) &&
                                  command({
                                    kind: "role",
                                    id: u.id,
                                    role: "admin",
                                    grant: !isAdmin,
                                  })
                                }
                              >
                                {isAdmin ? "Remove admin" : "Make admin"}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={busy}
                                onClick={() =>
                                  command({
                                    kind: "role",
                                    id: u.id,
                                    role: "moderator",
                                    grant: !isMod,
                                  })
                                }
                              >
                                {isMod ? "Remove moderator" : "Make moderator"}
                              </Button>
                              {u.id !== data.userId &&
                                (suspended.has(u.id) ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy}
                                    onClick={() => command({ kind: "suspend", id: u.id, suspended: false })}
                                  >
                                    <RotateCcw /> Reinstate
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={busy}
                                    onClick={() =>
                                      window.confirm(
                                        `Suspend ${u.display_name}? Their live listings will be hidden and they can't trade until reinstated.`,
                                      ) && command({ kind: "suspend", id: u.id, suspended: true })
                                    }
                                  >
                                    <Ban /> Suspend
                                  </Button>
                                ))}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

            {tab === "Reports" &&
              (data.reports.length === 0 ? (
                <Empty text="No reports." />
              ) : (
                data.reports.map((r) => (
                  <div key={r.id} className="activity-row flex flex-wrap justify-between gap-4">
                    <div>
                      <h2 className="text-lg">{r.listings?.title}</h2>
                      <p className="mt-2 text-muted-foreground">{r.reason}</p>
                      <span className="status-pill mt-2" data-tone={r.status === "open" ? "warning" : "success"}>{r.status}</span>
                    </div>
                    {r.status === "open" && (
                      <Button
                        size="sm"
                        disabled={busy}
                        onClick={() => command({ kind: "report", id: r.id })}
                      >
                        Mark resolved
                      </Button>
                    )}
                  </div>
                ))
              ))}

            {tab === "Support" &&
              (data.tickets.length === 0 ? (
                <Empty text="No support requests." />
              ) : (
                data.tickets.map((t) => (
                  <form
                    key={t.id}
                    className="activity-row space-y-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      command({
                        kind: "reply",
                        id: t.id,
                        reply: String(new FormData(e.currentTarget).get("reply")),
                      });
                    }}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg">{t.subject}</h2>
                      <span className="status-pill" data-tone={t.status === "resolved" ? "success" : "warning"}>{t.status}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      From {t.profiles?.display_name} · {new Date(t.created_at).toLocaleString()}
                    </p>
                    <p>{t.body}</p>
                    <Textarea
                      name="reply"
                      aria-label="Support reply"
                      placeholder="Reply to this request"
                      required
                      minLength={5}
                      defaultValue={t.reply ?? ""}
                    />
                    <Button size="sm" disabled={busy}>
                      Send reply & resolve
                    </Button>
                  </form>
                ))
              ))}

            {tab === "Activity" &&
              (data.audit.length === 0 ? (
                <Empty text="No administrator actions recorded yet." />
              ) : (
                <ol className="divide-y">
                  {data.audit.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2 py-3 text-sm">
                      <p>
                        <span className="font-medium text-heading">{userName.get(a.admin_id) ?? "Admin"}</span>{" "}
                        {a.action}
                        {a.detail ? <span className="text-muted-foreground"> · {a.detail}</span> : null}
                      </p>
                      <time className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ol>
              ))}

            {tab === "Site content" && <SiteContentEditor />}

            {tab === "Settings" && (
              <div className="grid gap-10 xl:grid-cols-2">
                <form
                  className="space-y-5 xl:col-span-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    command({
                      kind: "announcement",
                      text: String(new FormData(e.currentTarget).get("announcement")),
                    });
                  }}
                >
                  <h2 className="text-xl">Site announcement</h2>
                  <p className="text-sm text-muted-foreground">
                    Shown as a banner at the top of every page. Leave empty to hide it.
                  </p>
                  <Input
                    name="announcement"
                    maxLength={300}
                    aria-label="Announcement text"
                    placeholder="e.g. Scheduled maintenance on Sunday 02:00 UTC"
                    defaultValue={data.settings.announcement}
                  />
                  <Button disabled={busy}>Save announcement</Button>
                </form>
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    command({
                      kind: "settings",
                      email: String(fd.get("email")),
                      pay: String(fd.get("pay")),
                      trc: String(fd.get("trc")),
                      bep: String(fd.get("bep")),
                      jazzcash: String(fd.get("jazzcash") ?? ""),
                      easypaisa: String(fd.get("easypaisa") ?? ""),
                      raast: String(fd.get("raast") ?? ""),
                      bank: String(fd.get("bank") ?? ""),
                    });
                  }}
                >
                  <h2 className="text-xl">Receiving details</h2>
                  <p className="text-sm text-muted-foreground">
                    Only set addresses controlled by ClicksSpot. Transfers, refunds and payouts are
                    processed manually.
                  </p>
                  <FormField label="Support email">
                    <Input
                      type="email"
                      name="email"
                      required
                      defaultValue={data.settings.support_email}
                    />
                  </FormField>
                  <FormField label="Binance Pay ID">
                    <Input name="pay" defaultValue={data.payment.binance_pay_id} />
                  </FormField>
                  <FormField label="USDT TRC20 address">
                    <Input name="trc" defaultValue={data.payment.usdt_trc20_address} />
                  </FormField>
                  <FormField label="USDT BEP20 address">
                    <Input name="bep" defaultValue={data.payment.usdt_bep20_address} />
                  </FormField>
                  <FormField label="JazzCash account (number and name)">
                    <Input name="jazzcash" defaultValue={data.payment.jazzcash_account} />
                  </FormField>
                  <FormField label="Easypaisa account (number and name)">
                    <Input name="easypaisa" defaultValue={data.payment.easypaisa_account} />
                  </FormField>
                  <FormField label="Raast ID">
                    <Input name="raast" defaultValue={data.payment.raast_id} />
                  </FormField>
                  <FormField label="Bank transfer details (bank, account title, IBAN)">
                    <Input name="bank" defaultValue={data.payment.bank_transfer_details} />
                  </FormField>
                  <Button disabled={busy}>Save receiving details</Button>
                </form>
                <form
                  className="space-y-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    command({
                      kind: "commission",
                      rate: Number(new FormData(e.currentTarget).get("rate")),
                    });
                  }}
                >
                  <h2 className="text-xl">Marketplace commission</h2>
                  <p className="text-sm text-muted-foreground">
                    Charged to sellers on new deals. Buyers pay no commission. Existing deals keep
                    their agreed commission.
                  </p>
                  <FormField label="Seller commission (%)">
                    <Input
                      name="rate"
                      type="number"
                      min={0}
                      max={50}
                      step={0.5}
                      required
                      defaultValue={Number(data.settings.commission_rate) * 100}
                    />
                  </FormField>
                  <Button disabled={busy}>Save commission</Button>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
    </SiteLayout>
  );
}

function Stat({
  label,
  value,
  onClick,
}: {
  label: string;
  value: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="rounded-xl border bg-background p-5 text-left transition-colors enabled:hover:border-primary"
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-heading">{value}</p>
    </button>
  );
}
function Todo({ label, n, go }: { label: string; n: number; go: () => void }) {
  return (
    <button
      type="button"
      onClick={go}
      className="flex items-center justify-between rounded-lg border px-4 py-3 text-left text-sm hover:border-primary"
    >
      <span>{label}</span>
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${n > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
      >
        {n}
      </span>
    </button>
  );
}
function Empty({ text }: { text: string }) {
  return <p className="py-12 text-center text-muted-foreground">{text}</p>;
}

function MiniStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-background p-4">
      <TrendingUp className="h-5 w-5 text-accent-foreground" aria-hidden="true" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-heading">{value}</p>
      </div>
    </div>
  );
}
function Bars({ title, rows }: { title: string; rows: { label: string; n: number; tone: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="rounded-xl border bg-background p-5">
      <h2 className="mb-4 text-lg">{title}</h2>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.label} className="grid grid-cols-[8rem_minmax(0,1fr)_2rem] items-center gap-3 text-sm">
            <span className="capitalize text-muted-foreground">{r.label}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-muted">
              <span className="admin-bar" data-tone={r.tone} style={{ width: `${(r.n / max) * 100}%` }} />
            </span>
            <span className="text-right font-medium text-heading">{r.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
