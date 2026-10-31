import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AccountTypePicker } from "@/components/site/AccountTypePicker";
import type { AccountType } from "@/hooks/use-account-type";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/site/FormField";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useSession } from "@/hooks/use-session";
import { pageMeta } from "@/lib/seo";
import { safeReturnPath } from "@/lib/workflow";
export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: safeReturnPath(s["redirect"]) }),
  head: () => pageMeta("Sign in", "Sign in to buy, sell and manage your ClicksSpot deals."),
  component: Auth,
});
function Auth() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [accountType, setAccountType] = useState<AccountType>("buyer");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const { user } = useSession();
  const { redirect } = Route.useSearch();
  useEffect(() => {
    if (!user) return;
    (async () => {
      const chosen = sessionStorage.getItem("clicksspot-account-type");
      sessionStorage.removeItem("clicksspot-account-type");
      // Google sign-ups: apply the type picked before leaving, only for brand-new accounts
      if (chosen === "seller" && Date.now() - new Date(user.created_at).getTime() < 10 * 60_000) {
        await supabase.from("profiles").update({ account_type: "seller" }).eq("id", user.id);
      }
      const target = safeReturnPath(sessionStorage.getItem("clicksspot-return") ?? redirect);
      sessionStorage.removeItem("clicksspot-return");
      navigate({ to: target, replace: true });
    })();
  }, [user, redirect, navigate]);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      const email = String(form.get("email"));
      const password = String(form.get("password"));
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent(true);
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: String(form.get("name")), account_type: accountType },
            emailRedirectTo: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirect)}`,
          },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
        else await navigate({ to: redirect, replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await navigate({ to: redirect, replace: true });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  }
  async function social(provider: "google") {
    setBusy(true);
    sessionStorage.setItem("clicksspot-return", redirect);
    if (mode === "signup") sessionStorage.setItem("clicksspot-account-type", accountType);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}/auth?redirect=${encodeURIComponent(redirect)}`,
      });
      if (result.error) throw result.error;
      if (!result.redirected) await navigate({ to: redirect, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <SiteLayout>
      <div className="mx-auto max-w-md px-4 py-16">
        <p className="mb-2 text-sm text-accent-foreground">Your ClicksSpot account</p>
        <h1 className="text-3xl">
          {mode === "signup"
            ? "Create an account"
            : mode === "forgot"
              ? "Reset your password"
              : "Welcome back"}
        </h1>
        {sent ? (
          <div role="status" className="mt-8 space-y-4">
            <p>
              Check your email for your {mode === "forgot" ? "password reset" : "confirmation"}{" "}
              link.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSent(false);
                setMode("signin");
              }}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <>
            {mode !== "forgot" && (
              <div role="tablist" className="mt-6 grid grid-cols-2 rounded-lg border bg-muted p-1">
                {(["signin", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => setMode(m)}
                    className={`rounded-md py-2 text-sm font-medium ${mode === m ? "bg-card text-heading shadow-sm" : "text-muted-foreground"}`}
                  >
                    {m === "signin" ? "Sign in" : "Create account"}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={submit} className="mt-6 space-y-5">
              {mode === "signup" && (
                <AccountTypePicker value={accountType} onChange={setAccountType} />
              )}
              {mode === "signup" && (
                <FormField label="Display name">
                  <Input
                    name="name"
                    aria-label="Display name"
                    required
                    minLength={2}
                    autoComplete="name"
                  />
                </FormField>
              )}
              <FormField label="Email">
                <Input name="email" aria-label="Email" type="email" required autoComplete="email" />
              </FormField>
              {mode !== "forgot" && (
                <FormField label="Password">
                  <Input
                    name="password"
                    aria-label="Password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </FormField>
              )}
              {mode === "signup" && (
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" required className="mt-1" />{" "}
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" className="underline">
                      Terms
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              )}
              <Button disabled={busy} className="w-full" type="submit">
                {busy
                  ? "Please wait…"
                  : mode === "signup"
                    ? "Create account"
                    : mode === "forgot"
                      ? "Send reset link"
                      : "Sign in"}
              </Button>
            </form>
            {mode !== "forgot" && (
              <div className="mt-6 space-y-3">
                <div className="text-center text-xs text-muted-foreground">or continue with</div>
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={busy}
                  onClick={() => social("google")}
                >
                  Google
                </Button>
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                variant="link"
                onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
              >
                {mode === "signup" ? "Already have an account?" : "Create an account"}
              </Button>
              {mode === "signin" && (
                <Button variant="link" onClick={() => setMode("forgot")}>
                  Forgot password?
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
