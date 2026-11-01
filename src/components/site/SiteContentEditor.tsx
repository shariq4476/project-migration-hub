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
  colorFields,
  type ColorId,
  type Colors,
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
  const [colors, setColors] = useState<Colors>(content.colors);
  const [fontScale, setFontScale] = useState(content.fontScale);
  const [radius, setRadius] = useState(content.radius);

  async function save(next: SiteContent) {
    setBusy(true);
    const { data, error } = await supabase
      .from("site_settings")
      .update({ content: next as unknown as Json })
      .eq("id", 1)
      .select("id");
    setBusy(false);
    if (error || !data?.length) {
      toast.error(error?.message ?? "Could not save site content.");
      return;
    }
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
        const next: SiteContent = { ...content, font, colors, fontScale, radius };
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
      <FormField label={`Text size: ${fontScale}px`}>
        <input type="range" min={14} max={20} step={0.5} value={fontScale} aria-label="Text size" className="w-full" onChange={(e) => setFontScale(Number(e.target.value))} />
      </FormField>
      <FormField label={`Corner roundness: ${radius}`}>
        <input type="range" min={0} max={1.5} step={0.125} value={radius} aria-label="Corner roundness" className="w-full" onChange={(e) => setRadius(Number(e.target.value))} />
      </FormField>
      <div>
        <h3 className="text-lg">Colours</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(Object.keys(colorFields) as ColorId[]).map((id) => (
            <label key={id} className="flex items-center gap-3 rounded-md border p-2 text-sm">
              <input type="color" value={colors[id]} aria-label={colorFields[id].label} className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent" onChange={(e) => setColors({ ...colors, [id]: e.target.value })} />
              <span className="flex-1">{colorFields[id].label}</span>
              <code className="text-xs text-muted-foreground">{colors[id]}</code>
            </label>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-md p-4" style={{ background: colors.navy, color: colors.navyText }}>
          <span className="font-semibold">Preview</span>
          <span className="rounded-md px-4 py-2 text-sm font-medium" style={{ background: colors.primary, color: colors.primaryText }}>Button</span>
          <span className="rounded-md p-3 text-sm" style={{ background: colors.card, color: colors.text, border: `1px solid ${colors.border}` }}>
            <b style={{ color: colors.heading }}>Card title</b> · <span style={{ color: colors.muted }}>secondary text</span> · <span style={{ color: colors.link }}>link</span>
          </span>
        </div>
      </div>
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
