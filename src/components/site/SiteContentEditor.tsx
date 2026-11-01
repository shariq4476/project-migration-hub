import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/site/FormField";
import { useSiteContent, siteContentKey } from "@/hooks/use-site-content";
import {
  defaultContent,
  fontOptions,
  pairsToText,
  textToPairs,
  type FontId,
  type SiteContent,
} from "@/lib/site-content";

const textFields: [keyof SiteContent, string, boolean?][] = [
  ["siteName", "Site name (logo text)"],
  ["heroBadge", "Home: small badge above the headline"],
  ["heroTitle", "Home: headline"],
  ["heroHighlight", "Home: highlighted headline line"],
  ["heroSubtitle", "Home: intro paragraph", true],
  ["sellerTitle", "Home: seller section title"],
  ["sellerText", "Home: seller section text", true],
  ["ctaTitle", "Home: bottom banner title"],
  ["ctaText", "Home: bottom banner text", true],
  ["footerAbout", "Footer: about text", true],
  ["footerNote", "Footer: copyright line"],
  ["contactPhone", "Contact phone (shown in footer)"],
  ["contactWhatsapp", "WhatsApp number, e.g. +92 300 1234567"],
];
const listFields: [("stats" | "features" | "testimonials"), string][] = [
  ["stats", "Home: number band (one per line: number | label)"],
  ["features", "Home: why choose us (one per line: title | description)"],
  ["testimonials", "Home: testimonials (one per line: name, city | quote)"],
];

export function SiteContentEditor() {
  const content = useSiteContent();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [font, setFont] = useState<FontId>(content.font);

  async function save(next: SiteContent) {
    setBusy(true);
    const { data, error } = await supabase
      .from("site_settings")
      .update({ content: next as unknown as Json })
      .eq("id", 1)
      .select("id");
    setBusy(false);
    if (error || !data?.length) return toast.error(error?.message ?? "Could not save site content.");
    await qc.invalidateQueries({ queryKey: siteContentKey });
    toast.success("Site updated");
  }

  return (
    <form
      key={JSON.stringify(content)}
      className="max-w-3xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const next: SiteContent = { ...content, font };
        for (const [k] of textFields) (next as unknown as Record<string, string>)[k] = String(fd.get(k) ?? "");
        for (const [k] of listFields) next[k] = textToPairs(String(fd.get(k) ?? ""));
        void save(next);
      }}
    >
      <div>
        <h2 className="text-xl">Site content & look</h2>
        <p className="text-sm text-muted-foreground">
          Change the text, font and contact details shown across the site. Empty fields use the default text.
        </p>
      </div>
      <FormField label="Font">
        <select className="native-select" aria-label="Font" value={font} onChange={(e) => setFont(e.target.value as FontId)}>
          {Object.entries(fontOptions).map(([id, f]) => (
            <option key={id} value={id}>{f.label}</option>
          ))}
        </select>
      </FormField>
      <p className="rounded-md border p-4 text-lg" style={{ fontFamily: `"${fontOptions[font].display}"` }}>
        Preview: Buy and sell websites safely.
        <span className="mt-1 block text-sm" style={{ fontFamily: `"${fontOptions[font].sans}"` }}>
          Body text looks like this in the selected font.
        </span>
      </p>
      {textFields.map(([k, label, long]) => (
        <FormField key={k} label={label}>
          {long ? (
            <Textarea name={k} rows={3} defaultValue={String(content[k])} />
          ) : (
            <Input name={k} defaultValue={String(content[k])} />
          )}
        </FormField>
      ))}
      {listFields.map(([k, label]) => (
        <FormField key={k} label={label}>
          <Textarea name={k} rows={6} defaultValue={pairsToText(content[k])} />
        </FormField>
      ))}
      <div className="flex gap-3">
        <Button disabled={busy}>Save site content</Button>
        <Button
          type="button"
          variant="outline"
          disabled={busy}
          onClick={() => window.confirm("Reset all site text and font to defaults?") && save(defaultContent)}
        >
          Reset to defaults
        </Button>
      </div>
    </form>
  );
}
