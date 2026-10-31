import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Handshake, MessageSquare, LifeBuoy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usd } from "@/lib/listings";
import { stageLabels } from "@/lib/workflow";

type Deal = {
  id: string;
  stage: keyof typeof stageLabels;
  amount: number | string;
  updated_at: string;
  buyer_id: string;
  listings?: { title: string } | null;
};
type Offer = {
  id: string;
  buyer_id: string;
  status: string;
  amount: number | string;
  updated_at: string;
  listings?: { title: string } | null;
};
type Ticket = { id: string; subject: string; reply: string | null; created_at: string };

export type NotificationItem = {
  id: string;
  kind: "offer" | "deal" | "support";
  title: string;
  body: string;
  at: string;
  dealId?: string;
  tab?: string;
};

export function buildNotifications(
  userId: string,
  offers: Offer[],
  deals: Deal[],
  tickets: Ticket[],
): NotificationItem[] {
  const items: NotificationItem[] = [];
  for (const o of offers) {
    const mine = o.buyer_id === userId;
    if (!mine && o.status === "pending")
      items.push({
        id: `offer-${o.id}`,
        kind: "offer",
        title: "New offer received",
        body: `${usd(Number(o.amount))} on ${o.listings?.title ?? "your listing"}`,
        at: o.updated_at,
        tab: "Offers",
      });
    else if (mine && o.status !== "pending")
      items.push({
        id: `offer-${o.id}-${o.status}`,
        kind: "offer",
        title: `Your offer was ${o.status}`,
        body: `${usd(Number(o.amount))} on ${o.listings?.title ?? "a listing"}`,
        at: o.updated_at,
        tab: "Offers",
      });
  }
  for (const d of deals)
    items.push({
      id: `deal-${d.id}-${d.stage}`,
      kind: "deal",
      title: `Deal update: ${stageLabels[d.stage]}`,
      body: d.listings?.title ?? "Private deal",
      at: d.updated_at,
      dealId: d.id,
    });
  for (const t of tickets)
    if (t.reply)
      items.push({
        id: `ticket-${t.id}`,
        kind: "support",
        title: "Support replied",
        body: t.subject,
        at: t.created_at,
        tab: "Support",
      });
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

const KEY = "clicksspot-notifications-read";
const icons = { offer: MessageSquare, deal: Handshake, support: LifeBuoy };

export function useReadNotifications() {
  const [read, setRead] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      setRead(JSON.parse(localStorage.getItem(KEY) ?? "[]"));
    } catch {
      setRead([]);
    }
    setLoading(false);
  }, []);
  const save = (ids: string[]) => {
    setRead(ids);
    localStorage.setItem(KEY, JSON.stringify(ids.slice(-300)));
  };
  return {
    read,
    loading,
    markRead: (id: string) => !read.includes(id) && save([...read, id]),
    markAll: (ids: string[]) => save(Array.from(new Set([...read, ...ids]))),
  };
}

export function NotificationList({
  items,
  read,
  onOpen,
  onTab,
  loading = false,
}: {
  items: NotificationItem[];
  read: string[];
  onOpen: (id: string) => void;
  onTab: (tab: string) => void;
  loading?: boolean;
}) {
  if (loading)
    return (
      <div role="status" aria-live="polite" className="divide-y">
        <span className="sr-only">Loading notifications</span>
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3 px-3 py-3" aria-hidden="true">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ))}
      </div>
    );
  if (items.length === 0)
    return (
      <div role="status" className="flex flex-col items-center px-6 py-10 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground">
          <BellOff className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="mt-3 font-semibold">You're all caught up</p>
        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
          New offers, deal updates and support replies will appear here.
        </p>
      </div>
    );
  function onKeyDown(e: KeyboardEvent<HTMLUListElement>) {
    const nodes = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("[data-notification]"));
    const i = nodes.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = i < 0 ? 0 : Math.min(i + 1, nodes.length - 1);
    else if (e.key === "ArrowUp") next = i <= 0 ? 0 : i - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = nodes.length - 1;
    if (next >= 0) {
      e.preventDefault();
      nodes[next]?.focus();
    }
  }
  return (
    <ul
      className="divide-y"
      aria-label="Notifications. Use arrow keys to move between items."
      onKeyDown={onKeyDown}
    >
      {items.map((n) => {
        const Icon = icons[n.kind];
        const unread = !read.includes(n.id);
        const inner = (
          <>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{n.title}</span>
              <span className="block truncate text-sm text-muted-foreground">{n.body}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(n.at).toLocaleString()}
              </span>
            </span>
            {unread && (
              <>
                <span
                  className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                  aria-hidden="true"
                />
                <span className="sr-only">Unread</span>
              </>
            )}
          </>
        );
        const cls = `flex w-full gap-3 px-3 py-3 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${unread ? "bg-accent/40" : ""}`;
        return (
          <li key={n.id}>
            {n.dealId ? (
              <Link
                to="/deal/$id"
                params={{ id: n.dealId }}
                className={cls}
                data-notification
                onClick={() => onOpen(n.id)}
              >
                {inner}
              </Link>
            ) : (
              <button
                type="button"
                className={cls}
                data-notification
                onClick={() => {
                  onOpen(n.id);
                  if (n.tab) onTab(n.tab);
                }}
              >
                {inner}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function NotificationBell({
  items,
  onTab,
  read,
  markRead,
  markAll,
  loading,
}: {
  items: NotificationItem[];
  onTab: (tab: string) => void;
} & ReturnType<typeof useReadNotifications>) {
  const unread = useMemo(() => items.filter((i) => !read.includes(i.id)).length, [items, read]);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(22rem,calc(100vw-2rem))] p-0"
        aria-label="Notification center"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="font-sans text-base font-semibold">Notifications</h2>
          <Button
            variant="ghost"
            size="sm"
            disabled={unread === 0}
            onClick={() => markAll(items.map((i) => i.id))}
          >
            <CheckCheck aria-hidden="true" />
            Mark all read
          </Button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <NotificationList
            items={items.slice(0, 15)}
            read={read}
            onOpen={markRead}
            onTab={onTab}
            loading={loading}
          />
        </div>
        <span className="sr-only" aria-live="polite">
          {loading ? "" : `${unread} unread notifications`}
        </span>
        <button
          type="button"
          className="w-full border-t py-2 text-sm font-medium text-primary hover:bg-muted"
          onClick={() => onTab("Notifications")}
        >
          View all notifications
        </button>
      </PopoverContent>
    </Popover>
  );
}
