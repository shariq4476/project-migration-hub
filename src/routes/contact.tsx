import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { SiteLayout, PageHeader } from "@/components/site/SiteLayout";
import { FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { marketplaceCommand } from "@/lib/marketplace.functions";
import { useSession } from "@/hooks/use-session";
import { pageMeta } from "@/lib/seo";
export const Route = createFileRoute("/contact")({
  head: () =>
    pageMeta(
      "Contact ClicksSpot",
      "Contact the ClicksSpot team about listings, payments or private deals.",
    ),
  component: Contact,
});
function Contact() {
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <SiteLayout>
      <PageHeader title="Contact ClicksSpot" subtitle="Questions about a listing or a deal?" />
      <div className="workspace">
        <div className="max-w-xl">
          <p className="mb-8 text-muted-foreground">
            Email{" "}
            <a href="mailto:support@clicksspot.com" className="text-accent-foreground underline">
              support@clicksspot.com
            </a>{" "}
            or send a private support request.
          </p>
          {user ? (
            <form
              className="space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const f = new FormData(form);
                setBusy(true);
                try {
                  await marketplaceCommand({
                    data: {
                      kind: "support",
                      subject: String(f.get("subject")),
                      body: String(f.get("body")),
                    },
                  });
                  form.reset();
                  toast.success(
                    "Support request received. Replies appear in My account → Support.",
                  );
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : "Request failed");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <FormField label="Subject">
                <Input name="subject" aria-label="Subject" required minLength={3} maxLength={180} />
              </FormField>
              <FormField label="Message">
                <Textarea
                  name="body"
                  aria-label="Message"
                  rows={6}
                  required
                  minLength={10}
                  maxLength={4000}
                />
              </FormField>
              <Button disabled={busy}>Send support request</Button>
            </form>
          ) : (
            <Button asChild>
              <Link to="/auth" search={{ redirect: "/contact" }}>
                Sign in to contact support
              </Link>
            </Button>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
