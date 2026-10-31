import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FormField } from "@/components/site/FormField";
import { pageMeta } from "@/lib/seo";
export const Route = createFileRoute("/reset-password")({
  head: () => pageMeta("Set a new password", "Securely reset your ClicksSpot account password."),
  component: Reset,
});
function Reset() {
  const [valid, setValid] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    setValid(
      new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" ||
        new URLSearchParams(window.location.search).get("type") === "recovery",
    );
  }, []);
  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-3xl">Set a new password</h1>
        <form
          className="mt-8 space-y-5"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            if (form.get("password") !== form.get("confirm")) {
              toast.error("Passwords must match");
              return;
            }
            setBusy(true);
            try {
              const { data } = await supabase.auth.getUser();
              if (!data.user) throw new Error("Open the password reset link from your email.");
              const { error } = await supabase.auth.updateUser({
                password: String(form.get("password")),
              });
              if (error) throw error;
              toast.success("Password updated");
              await navigate({ to: "/dashboard" });
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Password could not be updated");
            } finally {
              setBusy(false);
            }
          }}
        >
          {!valid && (
            <p className="text-sm text-muted-foreground">
              Open your emailed reset link to continue.
            </p>
          )}
          <FormField label="New password">
            <Input
              name="password"
              aria-label="New password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Confirm password">
            <Input
              name="confirm"
              aria-label="Confirm password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
            />
          </FormField>
          <Button type="submit" disabled={busy}>
            Update password
          </Button>
        </form>
      </div>
    </SiteLayout>
  );
}
