import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { saveListing } from "@/lib/marketplace.functions";
import { categories, commissionFor, usd } from "@/lib/listings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./FormField";
import { useSession } from "@/hooks/use-session";
import type { Database } from "@/integrations/supabase/types";
type Row = Database["public"]["Tables"]["listings"]["Row"];
type Review = Database["public"]["Tables"]["listing_reviews"]["Row"];
export function SellForm({ initial, review }: { initial?: Row; review?: Review | null }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [fields, setFields] = useState({
    title: initial?.title ?? "",
    category: initial?.category ?? "adsense",
    sale_type: initial?.sale_type ?? "fixed",
    price: String(initial?.price ?? ""),
    monthly_revenue: String(initial?.monthly_revenue ?? 0),
    monthly_profit: String(initial?.monthly_profit ?? 0),
    monthly_traffic: String(initial?.monthly_traffic ?? 0),
    age_years: String(initial?.age_years ?? 0),
    summary: initial?.summary ?? "",
    description: initial?.description ?? "",
    url: initial?.url ?? "",
    ends_at: initial?.ends_at?.slice(0, 16) ?? "",
    ownership_method: review?.ownership_method ?? "dns",
    ownership_evidence: review?.ownership_evidence ?? "",
  });
  const set = (key: keyof typeof fields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }));
  async function upload(files: FileList | null) {
    if (!files || !user) return;
    setUploading(true);
    try {
      const paths: string[] = [];
      for (const file of Array.from(files)) {
        if (images.length + paths.length >= 6)
          throw new Error("A listing can have up to six images.");
        if (
          !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
          file.size > 5 * 1024 * 1024
        )
          throw new Error("Use JPG, PNG or WebP images under 5 MB.");
        const path = `${user.id}/${crypto.randomUUID()}.${file.name.split(".").pop()?.toLowerCase()}`;
        const { error } = await supabase.storage.from("listing-images").upload(path, file);
        if (error) throw error;
        paths.push(path);
      }
      setImages((prev) => [...prev, ...paths]);
      toast.success("Images uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  async function submit(status: "draft" | "pending") {
    setBusy(true);
    try {
      await saveListing({
        data: {
          ...(initial ? { id: initial.id } : {}),
          title: fields.title,
          category: fields.category as "adsense",
          sale_type: fields.sale_type as "fixed" | "auction",
          price: Number(fields.price),
          monthly_revenue: Number(fields.monthly_revenue),
          monthly_profit: Number(fields.monthly_profit),
          monthly_traffic: Number(fields.monthly_traffic),
          age_years: Number(fields.age_years),
          summary: fields.summary,
          description: fields.description,
          url: fields.url,
          images,
          status,
          ends_at:
            fields.sale_type === "auction" && fields.ends_at
              ? new Date(fields.ends_at).toISOString()
              : null,
          ownership_method: fields.ownership_method as "dns",
          ownership_evidence: fields.ownership_evidence,
        },
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      await queryClient.invalidateQueries({ queryKey: ["own-listing"] });
      toast.success(status === "draft" ? "Draft saved" : "Listing submitted for review");
      await navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Listing could not be saved");
    } finally {
      setBusy(false);
    }
  }
  const steps = ["Asset details", "Metrics & pricing", "Images & ownership", "Review"];
  return (
    <>
      <div className="workspace-tabs">
        {steps.map((s, i) => (
          <Button
            key={s}
            variant={step === i ? "secondary" : "ghost"}
            onClick={() => setStep(i)}
            size="sm"
          >
            {i + 1}. {s}
          </Button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          step < 3 ? setStep(step + 1) : submit("pending");
        }}
        className="max-w-3xl space-y-6"
      >
        {step === 0 && (
          <div className="form-grid">
            <FormField label="Website name">
              <Input
                aria-label="Website name"
                value={fields.title}
                onChange={(e) => set("title", e.target.value)}
                required
                minLength={5}
                maxLength={180}
              />
            </FormField>
            <FormField label="Website type">
              <select
                aria-label="Website type"
                className="native-select"
                value={fields.category}
                onChange={(e) => set("category", e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Website URL">
              <Input
                aria-label="Website URL"
                value={fields.url}
                onChange={(e) => set("url", e.target.value)}
                required
                type="url"
                placeholder="https://"
              />
            </FormField>
            <FormField label="Short summary">
              <Input
                aria-label="Short summary"
                value={fields.summary}
                onChange={(e) => set("summary", e.target.value)}
                required
                minLength={15}
                maxLength={500}
              />
            </FormField>
            <div className="sm:col-span-2">
              <FormField label="Description">
                <Textarea
                  aria-label="Description"
                  rows={6}
                  value={fields.description}
                  onChange={(e) => set("description", e.target.value)}
                  required
                  minLength={30}
                />
              </FormField>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="form-grid">
            {(
              [
                ["monthly_revenue", "Monthly revenue ($)"],
                ["monthly_profit", "Monthly profit ($)"],
                ["monthly_traffic", "Monthly visitors"],
                ["age_years", "Age in years"],
              ] as const
            ).map(([key, label]) => (
              <FormField key={key} label={label}>
                <Input
                  aria-label={label}
                  type="number"
                  step={key === "monthly_revenue" || key === "monthly_profit" ? ".01" : "1"}
                  min={key === "monthly_profit" ? undefined : 0}
                  value={fields[key]}
                  onChange={(e) => set(key, e.target.value)}
                  required
                />
              </FormField>
            ))}
            <FormField label="Sale type">
              <select
                aria-label="Sale type"
                className="native-select"
                value={fields.sale_type}
                onChange={(e) => set("sale_type", e.target.value)}
              >
                <option value="fixed">Fixed price</option>
                <option value="auction">Auction</option>
              </select>
            </FormField>
            <FormField
              label={fields.sale_type === "auction" ? "Starting price ($)" : "Asking price ($)"}
            >
              <Input
                aria-label="Asking price"
                type="number"
                min="0.01"
                step=".01"
                value={fields.price}
                onChange={(e) => set("price", e.target.value)}
                required
              />
            </FormField>
            {fields.sale_type === "auction" && (
              <FormField label="Auction closes">
                <Input
                  aria-label="Auction closes"
                  type="datetime-local"
                  value={fields.ends_at}
                  onChange={(e) => set("ends_at", e.target.value)}
                  required
                />
              </FormField>
            )}
            <p className="text-sm text-muted-foreground sm:col-span-2">
              Commission: {usd(commissionFor(Number(fields.price) || 0))}. Seller receives{" "}
              {usd((Number(fields.price) || 0) - commissionFor(Number(fields.price) || 0))} after
              completion.
            </p>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            <FormField label="Listing images">
              <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed p-6 text-sm">
                <Upload className="h-5 w-5 text-primary" />
                <span>{uploading ? "Uploading…" : "Choose images"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => upload(e.target.files)}
                />
              </label>
            </FormField>
            <ul className="space-y-2">
              {images.map((path, i) => (
                <li key={path} className="flex items-center justify-between text-sm">
                  <span>Image {i + 1}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    title="Remove image"
                    aria-label={`Remove image ${i + 1}`}
                    onClick={() => setImages(images.filter((p) => p !== path))}
                  >
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <FormField label="Ownership verification method">
              <select
                aria-label="Ownership verification method"
                className="native-select"
                value={fields.ownership_method}
                onChange={(e) => set("ownership_method", e.target.value)}
              >
                <option value="dns">DNS record</option>
                <option value="meta">Website meta tag</option>
                <option value="email">Domain email</option>
                <option value="analytics">Analytics evidence</option>
              </select>
            </FormField>
            <p className="text-sm text-muted-foreground">
              Verification reference: clicksspot-{user?.id.slice(0, 8)}. Add this to your DNS TXT
              record or website meta tag, or include supporting ownership details below.
            </p>
            <FormField label="Ownership evidence">
              <Textarea
                aria-label="Ownership evidence"
                rows={4}
                value={fields.ownership_evidence}
                onChange={(e) => set("ownership_evidence", e.target.value)}
                required
                minLength={5}
              />
            </FormField>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-2xl">{fields.title || "Untitled asset"}</h2>
            <p className="text-muted-foreground">{fields.summary}</p>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-muted-foreground">Price</dt>
                <dd>{usd(Number(fields.price) || 0)}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Sale type</dt>
                <dd>{fields.sale_type}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Images</dt>
                <dd>{images.length}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Verification</dt>
                <dd>{fields.ownership_method}</dd>
              </div>
            </dl>
            <p className="border-t pt-4 text-sm text-muted-foreground">
              Your listing stays private until a ClicksSpot administrator reviews it.
            </p>
          </div>
        )}
        <div className="flex flex-wrap gap-3 border-t pt-5">
          {step > 0 && (
            <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          <Button type="submit" disabled={busy || uploading}>
            {busy ? "Saving…" : step < 3 ? "Continue" : "Submit for review"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={busy || uploading}
            onClick={() => submit("draft")}
          >
            Save draft
          </Button>
        </div>
      </form>
    </>
  );
}
