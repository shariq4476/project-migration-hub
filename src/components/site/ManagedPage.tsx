import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useSiteContent, siteContentQuery } from "@/hooks/use-site-content";
import { defaultContent, type SiteContent } from "@/lib/site-content";
import type { PageId } from "@/lib/page-content";
import { pageMeta } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { SiteLayout, PageHeader } from "./SiteLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { commissionFor, usd } from "@/lib/listings";

export { siteContentQuery };
export function managedHead(id: PageId, content?: SiteContent) {
  const c = content ?? defaultContent;
  return pageMeta(c.pages[id].seoTitle, c.pages[id].seoDescription, c.siteName);
}

export function ManagedPage({ id }: { id: PageId }) {
  const c = useSiteContent();
  const p = c.pages[id];
  const isLegal = ["terms", "privacy", "refund"].includes(id);
  return <SiteLayout>
    <PageHeader title={p.title} subtitle={p.subtitle} eyebrow={p.eyebrow} />
    <div className="mx-auto grid max-w-7xl gap-12 px-4 py-14 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-20">
      <div className="min-w-0">
        {id === "fees" && <div className="mb-10 grid grid-cols-1 gap-6 border-y py-7 sm:grid-cols-3">
          {[{ title: "Example sale", value: usd(1000) }, { title: "Marketplace commission", value: usd(commissionFor(1000)) }, { title: "Seller proceeds", value: usd(1000 - commissionFor(1000)) }].map(x => <div key={x.title}><p className="text-sm text-muted-foreground">{x.title}</p><p className="mt-2 text-3xl font-bold text-heading">{x.value}</p></div>)}
        </div>}
        {id === "faq" ? <Accordion type="single" collapsible>{p.sections.map((section, i) => <AccordionItem id={`section-${i}`} key={i} value={String(i)}><AccordionTrigger className="py-6 text-left text-base text-heading">{section.title}</AccordionTrigger><AccordionContent className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">{section.text}</AccordionContent></AccordionItem>)}</Accordion> : <div>{p.sections.map((section, i) => <section key={i} id={`section-${i}`} className="scroll-mt-32 border-b pb-9 mb-9 last:mb-0 last:border-0">
          <p className="mb-3 text-xs font-semibold text-primary">{String(i + 1).padStart(2, "0")}</p><h2 className="text-2xl">{section.title}</h2><p className="mt-4 max-w-3xl whitespace-pre-line leading-relaxed text-muted-foreground">{section.text}</p>
        </section>)}</div>}
      </div>
      <aside className="space-y-8 lg:sticky lg:top-28 lg:self-start">
        <div><p className="mb-4 text-xs font-semibold uppercase text-muted-foreground">{p.eyebrow}</p><nav aria-label="On this page" className="space-y-3 border-l pl-4">{p.sections.map((section, i) => <a key={i} href={`#section-${i}`} className="block text-sm text-muted-foreground hover:text-primary">{section.title}</a>)}</nav></div>
        <div className="border-t pt-6"><ShieldCheck className="mb-3 h-6 w-6 text-primary"/><h3 className="text-lg">{c.labels.helpTitle}</h3><p className="mt-3 text-sm text-muted-foreground">{c.labels.helpText}</p><Button asChild variant="outline" className="mt-5"><Link to="/contact">{c.labels.helpButton}<ArrowRight/></Link></Button></div>
        <nav className="space-y-3 border-t pt-6" aria-label="Related pages">{isLegal ? <><Link className="block text-sm hover:text-primary" to="/terms">{c.labels.terms}</Link><Link className="block text-sm hover:text-primary" to="/privacy">{c.labels.privacy}</Link><Link className="block text-sm hover:text-primary" to="/refund">{c.labels.refund}</Link></> : <><Link className="block text-sm hover:text-primary" to="/buyer-guide">{c.labels.buyers}</Link><Link className="block text-sm hover:text-primary" to="/seller-guide">{c.labels.sellers}</Link><Link className="block text-sm hover:text-primary" to="/trust-safety">{c.labels.trust}</Link></>}</nav>
      </aside>
    </div>
  </SiteLayout>;
}