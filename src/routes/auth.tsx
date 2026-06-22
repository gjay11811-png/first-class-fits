import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";
import { z } from "zod";

const searchSchema = z.object({ redirect: z.string().optional() });

function safeRedirect(value: string | undefined): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Sign in — First Class Fits" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Account created — you're signed in.");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast.success("Reset link sent — check your email.");
        setMode("signin");
        setLoading(false);
        return;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
      }
      navigate({ to: safeRedirect(redirect) as never });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Authentication failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) { toast.error(result.error.message ?? "Google sign-in failed"); setLoading(false); return; }
    if (result.redirected) return;
    navigate({ to: safeRedirect(redirect) as never });
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">First Class Fits</p>
        <h1 className="font-display text-4xl uppercase tracking-tighter text-center mt-3">
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground text-center">
          {mode === "signin" ? "Welcome back. Sign in to track orders and save items." :
           mode === "signup" ? "Join the inner circle — early access to drops." :
           "Enter your email and we'll send you a reset link."}
        </p>

        {mode !== "reset" && (
          <>
            <button onClick={onGoogle} disabled={loading} className="mt-8 w-full border border-border py-3 text-sm font-semibold uppercase tracking-widest hover:border-primary disabled:opacity-50">
              Continue with Google
            </button>
            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
              <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <Input label="Full name" value={name} onChange={setName} />
          )}
          <Input label="Email" type="email" value={email} onChange={setEmail} required />
          {mode !== "reset" && (
            <Input label="Password" type="password" value={password} onChange={setPassword} required />
          )}
          <button disabled={loading} className="w-full bg-primary text-primary-foreground py-4 text-[11px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-50">
            {loading ? "Please wait..." : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </button>
        </form>

        {mode === "signin" && (
          <p className="mt-4 text-center text-xs">
            <button onClick={() => setMode("reset")} className="text-muted-foreground hover:text-primary uppercase tracking-widest font-bold">
              Forgot password?
            </button>
          </p>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {mode === "signin" ? "New to First Class Fits?" : mode === "signup" ? "Already have an account?" : "Remember your password?"}{" "}
          <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="text-primary uppercase tracking-widest font-bold">
            {mode === "signin" ? "Sign up" : mode === "signup" ? "Sign in" : "Sign in"}
          </button>
        </p>
        <p className="mt-2 text-center text-xs"><Link to="/" className="text-muted-foreground hover:text-primary">← Back home</Link></p>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent border border-border focus:border-primary outline-none px-3 py-3 text-sm" />
    </label>
  );
}
