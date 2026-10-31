import type React from "react";
import { Pkr, formatPkr, usePkrRate } from "@/hooks/use-pkr-rate";
import { paymentMethods, paymentMethodLabel } from "@/lib/payment-methods";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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
} from "lucide-react";
import { dealQuery } from "@/lib/marketplace.queries";
import { dealCommand, reviewSeller } from "@/lib/marketplace.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/site/FormField";
import { usd } from "@/lib/listings";
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
function Deal() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(dealQuery(id));
  const q = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<DealAction | null>(null);
  const [text, setText] = useState("");
  const [method, setMethod] = useState("binance_pay");
  const [message, setMessage] = useState("");
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
  return (
    <SiteLayout>
      <div className="bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Link
            to={data.isAdmin ? "/admin" : "/dashboard"}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {data.isAdmin ? "Admin console" : "My account"}
          </Link>
          <div className="mt-4 rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Private deal room
                </p>
                <h1 className="mt-2 text-2xl md:text-3xl">{d.listings?.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Deal #{d.id.slice(0, 8).toUpperCase()} · Opened{" "}
                  {new Date(d.created_at).toLocaleDateString()} · You are the{" "}
                  <span className="font-medium capitalize text-foreground">{role}</span>
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${halted ? "bg-destructive/10 text-destructive" : "bg-accent text-accent-foreground"}`}
              >
                {stageLabels[d.stage]}
              </span>
            </div>
            {halted ? (
              <div className="mt-6 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                This deal is {stageLabels[d.stage].toLowerCase()}.
                {d.dispute_reason && ` Reason: ${d.dispute_reason}`}
              </div>
            ) : (
              <ol className="mt-6 grid grid-cols-6 gap-2" aria-label="Deal progress">
                {steps.map((st, i) => {
                  const done = i < stepIndex || d.stage === "completed";
                  const current = i === stepIndex && d.stage !== "completed";
                  return (
                    <li key={st.key} aria-current={current ? "step" : undefined}>
                      <div
                        className={`h-1.5 rounded-full ${done ? "bg-primary" : current ? "bg-primary/50" : "bg-muted"}`}
                      />
                      <p
                        className={`mt-2 flex items-center gap-1 text-xs ${done || current ? "font-medium text-foreground" : "text-muted-foreground"}`}
                      >
                        {done && <Check className="h-3 w-3 text-primary" aria-hidden="true" />}
                        <span className="hidden sm:inline">{st.label}</span>
                      </p>
                    </li>
                  );
                })}
              </ol>
            )}
            <dl className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs text-muted-foreground">Agreed price</dt>
                <dd className="mt-1 text-xl font-semibold">{usd(Number(d.amount))}</dd>
                <Pkr usd={Number(d.amount)} />
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">ClicksSpot commission</dt>
                <dd className="mt-1 text-xl font-semibold">{usd(Number(d.commission))}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Seller receives</dt>
                <dd className="mt-1 text-xl font-semibold text-primary">
                  {usd(Number(d.amount) - Number(d.commission))}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="flex min-h-[32rem] flex-col rounded-xl border bg-card shadow-[var(--shadow-card)]">
              <div className="border-b px-5 py-4">
                <h2 className="font-sans text-base font-semibold">Conversation & activity</h2>
                <p className="text-xs text-muted-foreground">
                  Visible only to the buyer, seller and ClicksSpot administrators.
                </p>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
                {data.events.length === 0 && (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No messages yet. Say hello to start the conversation.
                  </p>
                )}
                {data.events.map((ev) => {
                  if (ev.kind === "system")
                    return (
                      <div key={ev.id} className="flex justify-center">
                        <p className="rounded-full bg-muted px-3 py-1 text-center text-xs text-muted-foreground">
                          {ev.body} · {new Date(ev.created_at).toLocaleString()}
                        </p>
                      </div>
                    );
                  const mine = ev.author_id === data.userId;
                  return (
                    <div key={ev.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[80%]">
                        <p
                          className={`mb-1 text-xs text-muted-foreground ${mine ? "text-right" : ""}`}
                        >
                          {mine ? "You" : (ev.profiles?.display_name ?? "Member")} ·{" "}
                          <time>{new Date(ev.created_at).toLocaleString()}</time>
                        </p>
                        <p
                          className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${mine ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted"}`}
                        >
                          {ev.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form
                className="flex items-end gap-2 border-t p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  command("message", message);
                }}
              >
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
                  placeholder="Write a private message… (Enter to send)"
                  className="min-h-11 resize-none"
                  rows={1}
                  required
                  maxLength={4000}
                />
                <Button
                  size="icon"
                  className="h-11 w-11"
                  aria-label="Send message"
                  disabled={busy || !message.trim()}
                >
                  <Send />
                </Button>
              </form>
            </section>

            <aside className="space-y-6">
              <Card title="Next steps">
                {actions.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {d.stage === "payment_submitted"
                      ? "ClicksSpot is reviewing payment proof."
                      : d.stage === "completed"
                        ? "The asset transfer is complete."
                        : "Waiting for the other participant."}
                  </p>
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
                    className="space-y-4 mt-4 border-t pt-4"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (window.confirm(`${labels[action]}?`)) command(action, text);
                    }}
                  >
                    <h3 className="text-lg">{labels[action]}</h3>
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
                        <div className="break-all rounded-md bg-muted p-3 text-sm">
                          {receiving || "Receiving details are not set. Do not send payment."}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {paymentMethods.find((m) => m.id === method)?.local
                            ? pkrRate
                              ? `Send ${formatPkr(Number(d.amount) * pkrRate)} (${usd(Number(d.amount))} at the live rate of Rs ${pkrRate.toFixed(2)} per $1). Put the deal ID in the payment note and use the transaction ID as reference.`
                              : `Send the rupee amount equal to ${usd(Number(d.amount))} at the live rate. Put the deal ID in the payment note.`
                            : `Send exactly ${usd(Number(d.amount))} in USDT. Match the network.`} Upload
                          payment proof before submitting.
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
              <Card title="Private files">
                <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed p-5 text-center text-sm transition-colors hover:border-primary hover:bg-accent/40 focus-within:ring-2 focus-within:ring-ring">
                  <Upload className="h-5 w-5 text-primary" aria-hidden="true" />
                  <span className="font-medium">
                    Upload{" "}
                    {d.stage === "agreement" && role === "buyer" ? "payment proof" : "a file"}
                  </span>
                  <span className="text-xs text-muted-foreground">Max 10 MB</span>
                  <input
                    type="file"
                    className="sr-only"
                    disabled={busy}
                    onChange={(e) => upload(e.target.files?.[0])}
                  />
                </label>
                {data.files.length > 0 && (
                  <ul className="mt-4 divide-y">
                    {data.files.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 py-2 text-sm">
                        <FileText
                          className="h-4 w-4 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
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
                  className="space-y-4 rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]"
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
                  <h2 className="text-xl">Review your seller</h2>
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
                    required
                    minLength={5}
                    maxLength={2000}
                  />
                  <Button disabled={busy}>Publish review</Button>
                </form>
              )}
              {data.review && (
                <p className="text-sm">
                  Seller review: {data.review.rating}/5 · {data.review.body}
                </p>
              )}
              <p className="flex gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                Payment verification records a manual check by ClicksSpot; it does not send money.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]">
      <h2 className="mb-4 font-sans text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-all">{value}</dd>
    </div>
  );
}
