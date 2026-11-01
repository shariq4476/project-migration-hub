import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ShieldCheck, Menu, X, LogOut, ArrowLeftRight, LoaderCircle, ArrowRight } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAccountType } from "@/hooks/use-account-type";
import { useSiteContent } from "@/hooks/use-site-content";
import { useCurrency } from "@/hooks/use-currency";
import { currencies, type CurrencyCode } from "@/lib/currency";

const nav = [
  { to: "/marketplace", label: "marketplace" },
  { to: "/how-it-works", label: "how" },
  { to: "/fees", label: "fees" },
  { to: "/trust-safety", label: "trust" },
  { to: "/contact", label: "contact" },
] as const;

export function Logo({ dark = false }: { dark?: boolean }) {
  const { siteName } = useSiteContent();
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
        {siteName.charAt(0).toUpperCase()}
      </span>
      <span className={dark ? "text-navy-foreground" : "text-foreground"}>{siteName}</span>
    </Link>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const account = useAccountType();
  const isSeller = account.type === "seller";
  const content = useSiteContent();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { redirect: "/dashboard" }, replace: true });
  }
  const { data: announcement } = useQuery({
    queryKey: ["announcement"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("announcement").eq("id", 1).maybeSingle();
      return data?.announcement ?? "";
    },
    staleTime: 60_000,
  });
  return (
    <div className="flex min-h-screen flex-col">
      {announcement && (
        <div role="status" className="bg-warning-soft text-warning-strong border-b border-warning/30">
          <p className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-sm font-medium">
            <Megaphone className="h-4 w-4 shrink-0" aria-hidden="true" />
            {announcement}
          </p>
        </div>
      )}
      <header className="sticky top-0 z-40 border-b border-navy-2 bg-navy">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo dark />
          <nav className="hidden items-center gap-5 xl:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm text-navy-muted hover:text-navy-foreground"
                activeProps={{ className: "text-sm text-primary font-semibold" }}
              >
                {content.labels[n.label]}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <CurrencySelect />
            {user && (
              <Button
                variant="ghost"
                size="sm"
                className="text-navy-foreground"
                disabled={account.loading || account.switching || !!account.error}
                aria-label={`Switch to ${isSeller ? "buyer" : "seller"} account`}
                title={`Switch to ${isSeller ? "buyer" : "seller"} account`}
                onClick={() => account.setType(isSeller ? "buyer" : "seller")}
              >
                {account.switching ? <LoaderCircle className="animate-spin" /> : <ArrowLeftRight />}
                <span>{account.loading ? "Loading…" : account.error ? "Unavailable" : isSeller ? "Seller" : "Buyer"}</span>
              </Button>
            )}
            <Button asChild size="sm" variant="outline" className="hidden sm:inline-flex">
              <Link to={user ? "/dashboard" : "/auth"}>{user ? content.labels.account : content.labels.signIn}</Link>
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="icon"
                title="Sign out"
                aria-label="Sign out"
                className="text-navy-foreground"
                onClick={signOut}
              >
                <LogOut />
              </Button>
            )}
            <Button asChild size="sm">
              <Link to={user && !isSeller ? "/marketplace" : "/sell"}>
                {user ? (isSeller ? content.labels.newListing : content.labels.browse) : content.labels.sell}
              </Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-navy-foreground xl:hidden"
              aria-label={open ? "Close navigation" : "Open navigation"}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
        {open && (
          <nav
            className="border-t border-navy-2 px-4 py-5 xl:hidden"
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          >
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="block py-3 text-navy-foreground"
                onClick={() => setOpen(false)}
              >
                {content.labels[n.label]}
              </Link>
            ))}
            <Link to={user ? "/dashboard" : "/auth"} className="block py-3 text-primary">
              {user ? content.labels.account : content.labels.signIn}
            </Link>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-navy text-navy-muted">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 border-b border-navy-2 px-4 py-10 md:flex-row md:items-center">
          <div><h2 className="text-2xl text-navy-foreground">{content.labels.footerTitle}</h2><p className="mt-2 max-w-2xl text-sm">{content.labels.footerText}</p></div>
          <Button asChild className="self-start md:self-auto"><Link to="/marketplace">{content.labels.browse}<ArrowRight /></Link></Button>
        </div>
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo dark />
            <p className="text-sm">{content.footerAbout}</p>
            {content.contactEmail && <a href={`mailto:${content.contactEmail}`} className="block text-sm hover:text-primary">{content.contactEmail}</a>}
            {content.contactPhone && <p className="text-sm">Phone: {content.contactPhone}</p>}
            {content.contactWhatsapp && (
              <a className="block text-sm hover:text-primary" href={`https://wa.me/${content.contactWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">
                WhatsApp: {content.contactWhatsapp}
              </a>
            )}
            <p className="flex items-center gap-2 text-xs">
              <ShieldCheck className="h-4 w-4 text-primary" /> {content.labels.footerTrust}
            </p>
          </div>
          <FooterCol
            title={content.labels.footerMarketplace}
            links={[
              ["/marketplace", content.labels.marketplace],
              ["/sell", content.labels.sell],
              ["/how-it-works", content.labels.how],
              ["/fees", content.labels.fees],
            ]}
          />
          <FooterCol
            title={content.labels.footerCompany}
            links={[
              ["/about", content.labels.about],
              ["/faq", content.labels.faq],
              ["/contact", content.labels.contact],
              ["/buyer-guide", content.labels.buyers],
              ["/seller-guide", content.labels.sellers],
              ["/trust-safety", content.labels.trust],
            ]}
          />
          <FooterCol
            title={content.labels.footerLegal}
            links={[
              ["/terms", content.labels.terms],
              ["/privacy", content.labels.privacy],
              ["/refund", content.labels.refund],
            ]}
          />
        </div>
        <div className="border-t border-navy-2 py-5 text-center text-xs">
          {content.footerNote}
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: ["/marketplace" | "/sell" | "/how-it-works" | "/fees" | "/about" | "/faq" | "/contact" | "/buyer-guide" | "/seller-guide" | "/trust-safety" | "/terms" | "/privacy" | "/refund", string][] }) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-navy-foreground">{title}</h4>
      <ul className="space-y-2 text-sm">
        {links.map(([to, label]) => (
          <li key={to}>
            <Link to={to} className="hover:text-primary">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PageHeader({ title, subtitle, eyebrow }: { title: string; subtitle?: string | undefined; eyebrow?: string }) {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-16">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground"><span>Home</span><ArrowRight className="h-3 w-3" /><span>{eyebrow ?? title}</span></Link>
        <h1 className="max-w-4xl text-3xl font-bold md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-5 max-w-3xl text-base leading-relaxed text-muted-foreground md:text-lg">{subtitle}</p>}
      </div>
    </section>
  );
}

function CurrencySelect() {
  const { code, setCode, updatedAt } = useCurrency();
  return (
    <select
      aria-label="Currency"
      title={updatedAt ? `Live rate updated ${new Date(updatedAt).toLocaleTimeString()}` : "Choose currency"}
      value={code}
      onChange={(e) => setCode(e.target.value as CurrencyCode)}
      className="h-9 rounded-md border border-navy-2 bg-navy px-2 text-sm text-navy-foreground"
    >
      {currencies.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code}
        </option>
      ))}
    </select>
  );
}
