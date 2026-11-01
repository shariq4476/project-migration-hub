import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { SellForm } from "@/components/site/SellForm";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { useSiteContent } from "@/hooks/use-site-content";
import { managedHead, siteContentQuery } from "@/components/site/ManagedPage";
import { useAccountType } from "@/hooks/use-account-type";
export const Route = createFileRoute("/sell")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => managedHead("sell", loaderData),
  component: Sell,
});
function Sell() {
  const c = useSiteContent();
  const { user, ready } = useSession();
  const account = useAccountType();
  return (
    <SiteLayout>
      <PageHeader
        title={c.pages.sell.title}
        subtitle={c.pages.sell.subtitle}
      />
      <div className="workspace">
        <div className="mb-12 grid gap-6 border-b pb-10 md:grid-cols-3">{c.pages.sell.sections.map((item, i) => <section key={i}><p className="mb-3 text-sm font-semibold text-primary">0{i + 1}</p><h2 className="text-lg">{item.title}</h2><p className="mt-3 text-sm text-muted-foreground">{item.text}</p></section>)}</div>
        {!ready ? (
          <p>Loading your account…</p>
        ) : user && account.loading ? (
          <p>Loading your account…</p>
        ) : user && account.error ? (
          <div role="alert" className="space-y-3">
            <p>Could not load your account type.</p>
            <Button variant="outline" onClick={() => account.retry()}>Try again</Button>
          </div>
        ) : user && account.type !== "seller" ? (
          <div className="max-w-xl space-y-5">
            <h2 className="text-2xl">Selling needs a seller account</h2>
            <p className="text-muted-foreground">
              You signed up as a buyer. Switch to a seller account to list websites and
              businesses. You can still buy as a seller.
            </p>
            <Button disabled={account.switching} onClick={() => account.setType("seller")}>
              Become a seller
            </Button>
          </div>
        ) : user ? (
          <SellForm />
        ) : (
          <div className="max-w-xl space-y-5">
            <h2 className="text-2xl">Start your next chapter</h2>
            <p className="text-muted-foreground">Sign in to submit your asset for review.</p>
            <Button asChild>
              <Link to="/auth" search={{ redirect: "/sell" }}>
                Sign in to sell
              </Link>
            </Button>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
