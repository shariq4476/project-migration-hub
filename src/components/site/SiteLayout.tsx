import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ShieldCheck, Menu, X, LogOut, ArrowLeftRight, LoaderCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAccountType } from "@/hooks/use-account-type";

const nav = [
  { to: "/marketplace", label: "Marketplace" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/fees", label: "Fees" },
  { to: "/faq", label: "FAQ" },
] as const;

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        C
      </span>
      <span className={dark ? "text-navy-foreground" : "text-foreground"}>ClicksSpot</span>
    </Link>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const account = useAccountType();
  const isSeller = account.type === "seller";
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
        <div className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo dark />
          <nav className="hidden gap-6 lg:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="text-sm text-navy-muted hover:text-navy-foreground"
                activeProps={{ className: "text-sm text-primary" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
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
              <Link to={user ? "/dashboard" : "/auth"}>{user ? "My account" : "Sign in"}</Link>
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
                {user ? (isSeller ? "New listing" : "Browse websites") : "Sell a website"}
              </Link>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="text-navy-foreground lg:hidden"
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
            className="border-t border-navy-2 px-4 py-5 lg:hidden"
            onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          >
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="block py-3 text-navy-foreground"
                onClick={() => setOpen(false)}
              >
                {n.label}
              </Link>
            ))}
            <Link to={user ? "/dashboard" : "/auth"} className="block py-3 text-primary">
              {user ? "My account" : "Sign in"}
            </Link>
          </nav>
        )}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-navy text-navy-muted">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4">
          <div className="space-y-3">
            <Logo dark />
            <p className="text-sm">
              The safe website marketplace for Pakistan & South Asia.
            </p>
            <p className="flex items-center gap-2 text-xs">
              <ShieldCheck className="h-4 w-4 text-primary" /> Funds held until the buyer confirms
            </p>
          </div>
          <FooterCol
            title="Marketplace"
            links={[
              ["/marketplace", "Browse listings"],
              ["/sell", "Sell a website"],
              ["/how-it-works", "How it works"],
              ["/fees", "Fees"],
            ]}
          />
          <FooterCol
            title="Company"
            links={[
              ["/about", "About"],
              ["/faq", "FAQ"],
              ["/contact", "Contact"],
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              ["/terms", "Terms of Service"],
              ["/privacy", "Privacy Policy"],
              ["/refund", "Refund Policy"],
            ]}
          />
        </div>
        <div className="border-t border-navy-2 py-5 text-center text-xs">
          © 2026 ClicksSpot. Pay with JazzCash, Easypaisa, Raast, bank transfer or USDT.
        </div>
      </footer>
    </div>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
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

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string | undefined }) {
  return (
    <section className="bg-hero text-navy-foreground">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-navy-muted">{subtitle}</p>}
      </div>
    </section>
  );
}
