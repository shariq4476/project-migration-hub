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
import { defaultPages, type PageId, type LabelId } from "@/lib/page-content";
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
  ["contactEmail", "Support email address"],
];
const listFields: [("stats" | "features" | "testimonials" | "homeSteps"), string][] = [
  ["stats", "Home: number band (one per line: number | label)"],
  ["features", "Home: why choose us (one per line: title | description)"],
  ["testimonials", "Home: testimonials (one per line: name, city | quote)"],
  ["homeSteps", "Home: process steps (one per line: title | description)"],
];

export function SiteContentEditor() {
  const content = useSiteContent();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [font, setFont] = useState<FontId>(content.font);
  const [colors, setColors] = useState<Colors>(content.colors);
  const [fontScale, setFontScale] = useState(content.fontScale);
  const [radius, setRadius] = useState(content.radius);
  const [pages, setPages] = useState(content.pages);
  const [labels, setLabels] = useState(content.labels);
  const [section, setSection] = useState<"appearance" | "home" | "pages" | "navigation">("appearance");
  const [pageId, setPageId] = useState<PageId>("about");

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
    qc.setQueryData(siteContentKey, next);
    await qc.invalidateQueries({ queryKey: siteContentKey });
    await qc.invalidateQueries({ queryKey: ["admin"] });
    toast.success("Site updated");
  }

  return (
    <form
      key={JSON.stringify(content)}
      className="max-w-3xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const next: SiteContent = { ...content, font, colors, fontScale, radius, pages, labels };
        for (const [k] of textFields) if (fd.has(k)) (next as unknown as Record<string, string>)[k] = String(fd.get(k) ?? "");
        for (const [k] of listFields) if (fd.has(k)) next[k] = textToPairs(String(fd.get(k) ?? ""));
        void save(next);
      }}
    >
      <div>
        <h2 className="text-xl">Website management</h2>
      </div>
      <div className="workspace-tabs" role="tablist" aria-label="Website settings">
        {(["appearance", "home", "pages", "navigation"] as const).map(id => <Button key={id} type="button" role="tab" aria-selected={section === id} variant={section === id ? "default" : "ghost"} onClick={() => setSection(id)}>{({ appearance: "Appearance", home: "Home & contact", pages: "All pages", navigation: "Header & footer" })[id]}</Button>)}
      </div>
      <div hidden={section !== "appearance"} className="space-y-6">
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
      </div>
      <div hidden={section !== "home"} className="space-y-5">
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
      </div>
      <div hidden={section !== "pages"} className="space-y-5">
        <FormField label="Page"><select className="native-select" aria-label="Page" value={pageId} onChange={e => setPageId(e.target.value as PageId)}>{(Object.keys(defaultPages) as PageId[]).map(id => <option key={id} value={id}>{id === "home" ? "Home — search preview" : defaultPages[id].title}</option>)}</select></FormField>
        {(["title", "subtitle", "eyebrow", "seoTitle", "seoDescription"] as const).map(field => <FormField key={field} label={({ title: "Page title", subtitle: "Introduction", eyebrow: "Category label", seoTitle: "Search title", seoDescription: "Search description" })[field]}><Input aria-label={field} value={pages[pageId][field]} onChange={e => setPages({ ...pages, [pageId]: { ...pages[pageId], [field]: e.target.value } })}/></FormField>)}
        {pages[pageId].sections.map((item, i) => <fieldset key={`${pageId}-${i}`} className="space-y-3 border-t pt-5"><legend className="text-sm font-semibold">Section {i + 1}</legend><Input aria-label={`Section ${i + 1} title`} value={item.title} onChange={e => setPages({ ...pages, [pageId]: { ...pages[pageId], sections: pages[pageId].sections.map((x, j) => j === i ? { ...x, title: e.target.value } : x) } })}/><Textarea aria-label={`Section ${i + 1} content`} rows={5} value={item.text} onChange={e => setPages({ ...pages, [pageId]: { ...pages[pageId], sections: pages[pageId].sections.map((x, j) => j === i ? { ...x, text: e.target.value } : x) } })}/><div className="flex gap-2"><Button type="button" variant="outline" disabled={i === 0} onClick={() => { const items = [...pages[pageId].sections]; [items[i - 1], items[i]] = [items[i], items[i - 1]]; setPages({ ...pages, [pageId]: { ...pages[pageId], sections: items } }); }}>Move up</Button><Button type="button" variant="ghost" onClick={() => setPages({ ...pages, [pageId]: { ...pages[pageId], sections: pages[pageId].sections.filter((_, j) => i !== j) } })}>Remove section</Button></div></fieldset>)}
        <Button type="button" variant="outline" onClick={() => setPages({ ...pages, [pageId]: { ...pages[pageId], sections: [...pages[pageId].sections, { title: "", text: "" }] } })}>Add section</Button>
      </div>
      <div hidden={section !== "navigation"} className="grid gap-5 sm:grid-cols-2">
        {(Object.keys(labels) as LabelId[]).map(id => <FormField key={id} label={id.replace(/([A-Z])/g, " $1").replace(/^./, x => x.toUpperCase())}><Input aria-label={`Label ${id}`} value={labels[id]} onChange={e => setLabels({ ...labels, [id]: e.target.value })}/></FormField>)}
      </div>
      <div className="sticky bottom-0 flex gap-3 border-t bg-background py-4">
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
