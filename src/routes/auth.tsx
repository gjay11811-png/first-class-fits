import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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

        {/* Animated gold hairline with a travelling sheen — brand accent */}
        <motion.div
          aria-hidden
          className="mx-auto mt-8 flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative h-px w-48 overflow-hidden">
            <div className="absolute inset-0 gold-rule" />
            <motion.span
              className="absolute top-1/2 h-[3px] w-10 -translate-y-1/2 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent, oklch(0.85 0.10 84 / 0.9), transparent)",
                boxShadow: "0 0 10px 1px oklch(0.85 0.10 84 / 0.6)",
              }}
              initial={{ left: "-20%" }}
              animate={{ left: ["-20%", "100%", "-20%"] }}
              transition={{ duration: 4.5, ease: "easeInOut", repeat: Infinity }}
            />
          </div>
        </motion.div>

        <form onSubmit={onSubmit} className="mt-8 space-y-3">
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
