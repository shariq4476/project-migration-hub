import type React from "react";
import { formatPkr, usePkrRate } from "@/hooks/use-pkr-rate";
import { paymentMethods, paymentMethodLabel } from "@/lib/payment-methods";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Send,
  Upload,
  Download,
  ArrowLeft,
  Check,
  ShieldCheck,
  FileText,
  Lock,
  AlertTriangle,
  Copy,
  Clock,
  Wallet,
  Receipt,
  MessageSquare,
  Star,
  Info,
} from "lucide-react";
import { dealQuery } from "@/lib/marketplace.queries";
import { dealCommand, reviewSeller } from "@/lib/marketplace.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/site/FormField";
import { usdExact } from "@/lib/listings";
import { stageLabels, permittedActions, type DealAction } from "@/lib/workflow";
import { pageMeta } from "@/lib/seo";
export const Route = createFileRoute("/_authenticated/deal/$id")({
  loader: ({ params, context }) => context.queryClient.ensureQueryData(dealQuery(params.id)),
  head: () =>
    pageMeta(
      "Private deal room",
      "Manage payment proof, asset transfer and private ClicksSpot deal messages.",
    ),
  component: Deal,
});
const labels: Record<DealAction, string> = {
  submit_payment: "Submit payment for review",
  verify_payment: "Verify payment received",
  reject_payment: "Reject payment proof",
  start_transfer: "Start asset transfer",
  mark_delivered: "Mark asset delivered",
  approve: "Approve received asset",
  dispute: "Open a dispute",
  resolve_complete: "Resolve as completed",
  resolve_refund: "Record buyer refund",
  cancel: "Cancel unpaid deal",
  mark_paid: "Record seller payout",
};
const stageHelp: Record<string, string> = {
  agreement: "Buyer sends payment to ClicksSpot escrow and uploads proof.",
  payment_submitted: "ClicksSpot is verifying the payment manually.",
  payment_verified: "Funds are secured. Seller can begin the transfer.",
  transferring: "Seller is transferring credentials and ownership.",
  delivered: "Buyer checks the asset and approves or opens a dispute.",
  completed: "Deal closed. Seller payout is released by ClicksSpot.",
  disputed: "ClicksSpot is reviewing the dispute with both parties.",
  refunded: "The buyer has been refunded.",
  cancelled: "This deal was cancelled before payment.",
};
function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "M";
}
function Deal() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(dealQuery(id));
  const q = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<DealAction | null>(null);
  const [text, setText] = useState("");
  const [method, setMethod] = useState("binance_pay");
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const d = data.deal;
  const role = data.isAdmin ? "admin" : d.buyer_id === data.userId ? "buyer" : "seller";
  const actions = permittedActions(d.stage, role, Boolean(d.payout_paid_at));
  useEffect(() => {
    const ch = supabase
      .channel(`deal-${id}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deal_events", filter: `deal_id=eq.${id}` },
        () => q.invalidateQueries({ queryKey: ["deal", id] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [id, q]);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [data.events.length]);
  async function command(a: DealAction | "message", body: string) {
    setBusy(true);
    try {
      await dealCommand({ data: { id, action: a, text: body, method } });
      setAction(null);
      setText("");
      setMessage("");
      await q.invalidateQueries();
      toast.success(a === "message" ? "Message sent" : "Deal updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Files must be under 10 MB.");
      const path = `${id}/${data.userId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("deal-evidence").upload(path, file);
      if (error) throw error;
      const { error: recordError } = await supabase.from("deal_files").insert({
        deal_id: id,
        uploader_id: data.userId,
        path,
        name: file.name,
        kind: d.stage === "agreement" && role === "buyer" ? "payment" : "attachment",
      });
      if (recordError) throw recordError;
      await q.invalidateQueries({ queryKey: ["deal", id] });
      toast.success("Private file uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  async function download(path: string) {
    const { data, error } = await supabase.storage.from("deal-evidence").createSignedUrl(path, 120);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }
  function copy(value: string, what: string) {
    navigator.clipboard.writeText(value).then(
      () => toast.success(`${what} copied`),
      () => toast.error("Could not copy"),
    );
  }
  const pkrRate = usePkrRate();
  const receiving =
    (data.settings as unknown as Record<string, string>)[
      paymentMethods.find((m) => m.id === method)?.setting ?? ""
    ] ?? "";
  const steps = [
    { key: "agreement", label: "Agreement" },
    { key: "payment_submitted", label: "Payment sent" },
    { key: "payment_verified", label: "Verified" },
    { key: "transferring", label: "Transfer" },
    { key: "delivered", label: "Delivered" },
    { key: "completed", label: "Completed" },
  ];
  const stepIndex = steps.findIndex((st) => st.key === d.stage);
  const halted = ["disputed", "refunded", "cancelled"].includes(d.stage);
  const dealRef = d.id.slice(0, 8).toUpperCase();
  const amount = Number(d.amount);
  const commission = Number(d.commission);
  let lastDay = "";
  return (
    <SiteLayout>
      <div className="min-h-screen bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-6 md:py-8">
          <nav className="flex items-center justify-between gap-3 text-sm">
            <Link
              to={data.isAdmin ? "/admin" : "/dashboard"}
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              {data.isAdmin ? "Admin console" : "My account"}
            </Link>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3 text-primary" aria-hidden="true" /> End-to-end private
              deal room
            </span>
          </nav>

          {/* Header */}
          <header className="mt-4 overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-4 p-6">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">
                  Escrow deal
                </p>
                <h1 className="mt-1 truncate text-2xl md:text-3xl">{d.listings?.title}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => copy(d.id, "Deal ID")}
                    className="inline-flex items-center gap-1 font-mono hover:text-foreground"
                    aria-label="Copy deal ID"
                  >
                    #{dealRef} <Copy className="h-3 w-3" aria-hidden="true" />
                  </button>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    Opened {new Date(d.created_at).toLocaleDateString()}
                  </span>
                  <span>
                    Your role:{" "}
                    <span className="font-medium capitalize text-foreground">{role}</span>
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${halted ? "bg-destructive/10 text-destructive" : d.stage === "completed" ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"}`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${halted ? "bg-destructive" : "bg-primary"}`}
                    aria-hidden="true"
                  />
                  {stageLabels[d.stage]}
                </span>
                <p className="mt-2 max-w-xs text-xs text-muted-foreground">
                  {stageHelp[d.stage]}
                </p>
              </div>
            </div>

            <div className="border-t bg-muted/30 px-6 py-5">
              {halted ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    This deal is {stageLabels[d.stage].toLowerCase()}.
                    {d.dispute_reason && ` Reason: ${d.dispute_reason}`}
                  </span>
                </div>
              ) : (
                <ol className="grid grid-cols-6 gap-1" aria-label="Deal progress">
                  {steps.map((st, i) => {
                    const done = i < stepIndex || d.stage === "completed";
                    const current = i === stepIndex && d.stage !== "completed";
                    return (
                      <li
                        key={st.key}
                        aria-current={current ? "step" : undefined}
                        className="relative flex flex-col items-center text-center"
                      >
                        {i > 0 && (
                          <span
                            className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${i <= stepIndex || d.stage === "completed" ? "bg-primary" : "bg-border"}`}
                            aria-hidden="true"
                          />
                        )}
                        <span
                          className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-semibold ${done ? "border-primary bg-primary text-primary-foreground" : current ? "border-primary bg-card text-primary ring-4 ring-primary/15" : "border-border bg-card text-muted-foreground"}`}
                        >
                          {done ? <Check className="h-4 w-4" aria-hidden="true" /> : i + 1}
                        </span>
                        <span
                          className={`mt-2 hidden text-xs sm:block ${done || current ? "font-medium text-foreground" : "text-muted-foreground"}`}
                        >
                          {st.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            <dl className="grid divide-y border-t sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              <Stat icon={<Receipt className="h-4 w-4" />} label="Agreed price">
                <span className="text-xl font-semibold">{usdExact(amount)}</span>

              </Stat>
              <Stat icon={<ShieldCheck className="h-4 w-4" />} label="ClicksSpot commission">
                <span className="text-xl font-semibold">{usdExact(commission)}</span>
              </Stat>
              <Stat icon={<Wallet className="h-4 w-4" />} label="Seller receives">
                <span className="text-xl font-semibold text-primary">
                  {usdExact(amount - commission)}
                </span>
              </Stat>
            </dl>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            {/* Chat */}
            <section className="flex h-[36rem] flex-col overflow-hidden rounded-2xl border bg-card shadow-[var(--shadow-card)] lg:h-[calc(100vh-8rem)] lg:max-h-[48rem]">
              <div className="flex items-center justify-between border-b px-5 py-4">
                <div>
                  <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
                    <MessageSquare className="h-4 w-4 text-primary" aria-hidden="true" />
                    Conversation & activity
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Visible only to the buyer, seller and ClicksSpot administrators.
                  </p>
                </div>
                <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-primary" aria-hidden="true" />
                  Live
                </span>
              </div>
              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto bg-muted/20 px-5 py-5"
                aria-live="polite"
              >
                {data.events.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <MessageSquare className="h-8 w-8 opacity-40" aria-hidden="true" />
                    No messages yet. Say hello to start the conversation.
                  </div>
                )}
                {data.events.map((ev) => {
                  const day = new Date(ev.created_at).toDateString();
                  const divider =
                    day !== lastDay ? (
                      <div className="flex items-center gap-3 py-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                        <span className="h-px flex-1 bg-border" />
                        {new Date(ev.created_at).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    ) : null;
                  lastDay = day;
                  const time = new Date(ev.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  if (ev.kind === "system")
                    return (
                      <div key={ev.id} className="space-y-4">
                        {divider}
                        <div className="flex justify-center">
                          <p className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-center text-xs text-muted-foreground">
                            <Info className="h-3 w-3 text-primary" aria-hidden="true" />
                            {ev.body} · {time}
                          </p>
                        </div>
                      </div>
                    );
                  const mine = ev.author_id === data.userId;
                  const name = mine ? "You" : (ev.profiles?.display_name ?? "Member");
                  return (
                    <div key={ev.id} className="space-y-4">
                      {divider}
                      <div className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${mine ? "bg-primary/15 text-primary" : "bg-accent text-accent-foreground"}`}
                          aria-hidden="true"
                        >
                          {initials(mine ? "You" : name)}
                        </span>
                        <div className={`max-w-[75%] ${mine ? "text-right" : ""}`}>
                          <p className="mb-1 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">{name}</span> ·{" "}
                            <time dateTime={ev.created_at}>{time}</time>
                          </p>
                          <p
                            className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-left text-sm shadow-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm border bg-card"}`}
                          >
                            {ev.body}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="border-t bg-card p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim()) command("message", message);
                }}
              >
                <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 focus-within:ring-2 focus-within:ring-ring">
                  <Textarea
                    aria-label="Private message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && message.trim()) {
                        e.preventDefault();
                        command("message", message);
                      }
                    }}
                    placeholder="Write a private message…"
                    className="min-h-10 resize-none border-0 shadow-none focus-visible:ring-0"
                    rows={1}
                    maxLength={4000}
                  />
                  <Button
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    aria-label="Send message"
                    disabled={busy || !message.trim()}
                  >
                    <Send />
                  </Button>
                </div>
                <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
                  Enter to send · Shift + Enter for a new line · Never share passwords outside
                  this room.
                </p>
              </form>
            </section>

            <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
              <Card title="Next steps" accent>
                <p className="mb-4 text-sm text-muted-foreground">{stageHelp[d.stage]}</p>
                {actions.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {d.stage === "payment_submitted"
                      ? "ClicksSpot is reviewing payment proof."
                      : d.stage === "completed"
                        ? "The asset transfer is complete."
                        : "Waiting for the other participant."}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {actions.map((a) => (
                      <Button
                        key={a}
                        className="w-full"
                        variant={
                          a === "dispute" || a === "cancel" || a === "reject_payment"
                            ? "outline"
                            : "default"
                        }
                        disabled={busy}
                        onClick={() => {
                          setAction(a);
                          setText("");
                        }}
                      >
                        {labels[a]}
                      </Button>
                    ))}
                  </div>
                )}
                {action && (
                  <form
                    className="mt-4 space-y-4 rounded-lg border bg-muted/30 p-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (window.confirm(`${labels[action]}?`)) command(action, text);
                    }}
                  >
                    <h3 className="font-sans text-sm font-semibold">{labels[action]}</h3>
                    {action === "submit_payment" && (
                      <>
                        <FormField label="Payment method">
                          <select
                            className="native-select"
                            value={method}
                            onChange={(e) => setMethod(e.target.value)}
                          >
                            {paymentMethods.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </FormField>
                        <div className="rounded-md border bg-card p-3">
                          <p className="text-xs text-muted-foreground">Send payment to</p>
                          <div className="mt-1 flex items-start justify-between gap-2">
                            <p className="break-all font-mono text-sm">
                              {receiving || "Receiving details are not set. Do not send payment."}
                            </p>
                            {receiving && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                aria-label="Copy receiving details"
                                onClick={() => copy(receiving, "Details")}
                              >
                                <Copy />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {paymentMethods.find((m) => m.id === method)?.local
                            ? pkrRate
                              ? `Send ${formatPkr(amount * pkrRate)} (${usdExact(amount)} at the live rate of Rs ${pkrRate.toFixed(2)} per $1). Put the deal ID in the payment note and use the transaction ID as reference.`
                              : `Send the rupee amount equal to ${usdExact(amount)} at the live rate. Put the deal ID in the payment note.`
                            : `Send exactly ${usdExact(amount)} in USDT. Match the network.`}{" "}
                          Upload payment proof before submitting.
                        </p>
                      </>
                    )}
                    {[
                      "submit_payment",
                      "reject_payment",
                      "mark_delivered",
                      "dispute",
                      "resolve_complete",
                      "resolve_refund",
                      "mark_paid",
                    ].includes(action) && (
                      <FormField
                        label={
                          ["submit_payment", "resolve_refund", "mark_paid"].includes(action)
                            ? "Transaction reference"
                            : "Notes or reason"
                        }
                      >
                        <Textarea
                          aria-label="Action details"
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          required
                          minLength={1}
                          maxLength={4000}
                        />
                      </FormField>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={busy || (action === "submit_payment" && !receiving)}
                      >
                        Confirm
                      </Button>
                      <Button variant="ghost" type="button" onClick={() => setAction(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </Card>
              {(d.payment_txid || d.transfer_notes || d.payout_reference) && (
                <Card title="Deal record">
                  <dl className="space-y-3 text-sm">
                    {d.payment_txid && <Row label="Payment reference" value={d.payment_txid} />}
                    {d.transfer_notes && <Row label="Delivery notes" value={d.transfer_notes} />}
                    {d.payout_reference && (
                      <Row
                        label={d.stage === "refunded" ? "Refund reference" : "Payout reference"}
                        value={d.payout_reference}
                      />
                    )}
                  </dl>
                </Card>
              )}
              <Card title={`Private files${data.files.length ? ` (${data.files.length})` : ""}`}>
                <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-5 text-center text-sm transition-colors hover:border-primary hover:bg-accent/40 focus-within:ring-2 focus-within:ring-ring">
                  <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="font-medium">
                    Upload{" "}
                    {d.stage === "agreement" && role === "buyer" ? "payment proof" : "a file"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Screenshots, PDFs, documents · Max 10 MB
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => upload(e.target.files?.[0])}
                  />
                </label>
                {data.files.length > 0 && (
                  <ul className="mt-4 divide-y rounded-lg border">
                    {data.files.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-accent">
                          <FileText className="h-4 w-4 text-accent-foreground" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1 truncate" title={f.name}>
                          {f.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Download ${f.name}`}
                          onClick={() => download(f.path)}
                        >
                          <Download />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
              {data.isAdmin && d.stage === "completed" && (
                <Card title="Seller payout details">
                  <p className="break-all text-sm">
                    {data.payout
                      ? `${paymentMethodLabel(data.payout.method)}: ${data.payout.account}`
                      : "Seller has not set payout details."}
                  </p>
                </Card>
              )}
              {d.stage === "completed" && role === "buyer" && !data.review && (
                <form
                  className="space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    setBusy(true);
                    try {
                      await reviewSeller({
                        data: {
                          dealId: id,
                          rating: Number(f.get("rating")),
                          body: String(f.get("review")),
                        },
                      });
                      await q.invalidateQueries();
                      toast.success("Review published");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Could not publish review");
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  <h2 className="font-sans text-base font-semibold">Review your seller</h2>
                  <select
                    name="rating"
                    aria-label="Seller rating"
                    className="native-select"
                    defaultValue="5"
                  >
                    {[5, 4, 3, 2, 1].map((r) => (
                      <option key={r} value={r}>
                        {r} stars
                      </option>
                    ))}
                  </select>
                  <Textarea
                    name="review"
                    aria-label="Seller review"
                    placeholder="How was the transfer?"
                    required
                    minLength={5}
                    maxLength={2000}
                  />
                  <Button className="w-full" disabled={busy}>
                    Publish review
                  </Button>
                </form>
              )}
              {data.review && (
                <Card title="Your review">
                  <p className="flex items-center gap-1 text-sm font-medium">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < data.review!.rating ? "fill-primary text-primary" : "text-muted-foreground"}`}
                        aria-hidden="true"
                      />
                    ))}
                    <span className="ml-1">{data.review.rating}/5</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">{data.review.body}</p>
                </Card>
              )}
              <div className="rounded-2xl border bg-card p-4 text-xs text-muted-foreground">
                <p className="flex items-center gap-2 font-medium text-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" /> ClicksSpot
                  escrow protection
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Keep all communication and payments inside this room.</li>
                  <li>Seller is paid only after the buyer approves delivery.</li>
                  <li>Payment verification is a manual check by ClicksSpot.</li>
                </ul>
                <Link to="/contact" className="mt-3 inline-block text-primary hover:underline">
                  Need help? Contact support
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-4">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="text-primary" aria-hidden="true">
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
function Card({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)] ${accent ? "border-t-4 border-t-primary" : ""}`}
    >
      <h2 className="mb-3 font-sans text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-all font-mono text-sm">{value}</dd>
    </div>
  );
}
