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
import { useSiteContent } from "@/hooks/use-site-content";
import { managedHead, siteContentQuery } from "@/components/site/ManagedPage";
export const Route = createFileRoute("/contact")({
  loader: ({ context }) => context.queryClient.ensureQueryData(siteContentQuery),
  head: ({ loaderData }) => managedHead("contact", loaderData),
  component: Contact,
});
function Contact() {
  const c = useSiteContent();
  const { user } = useSession();
  const [busy, setBusy] = useState(false);
  return (
    <SiteLayout>
      <PageHeader title={c.pages.contact.title} subtitle={c.pages.contact.subtitle} eyebrow={c.pages.contact.eyebrow} />
      <div className="workspace grid gap-12 lg:grid-cols-2">
        <div className="max-w-xl">
          <h2 className="mb-6 text-2xl">{c.labels.helpTitle}</h2>
          {c.contactEmail && <a className="mb-6 block text-primary" href={`mailto:${c.contactEmail}`}>{c.contactEmail}</a>}
          {c.contactPhone && <a className="mb-3 block text-primary" href={`tel:${c.contactPhone.replace(/[^+0-9]/g, "")}`}>{c.contactPhone}</a>}
          {c.contactWhatsapp && <a className="mb-6 block text-primary" href={`https://wa.me/${c.contactWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp · {c.contactWhatsapp}</a>}
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
        <aside className="space-y-8">{c.pages.contact.sections.map((item, i) => <section key={i} className="border-b pb-8"><h2 className="text-xl">{item.title}</h2><p className="mt-3 text-muted-foreground">{item.text}</p></section>)}</aside>
      </div>
    </SiteLayout>
  );
}
