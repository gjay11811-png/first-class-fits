import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";

const searchSchema = z.object({ token: z.string().optional() });

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Unsubscribe — First Class Fits" }] }),
  component: UnsubscribePage,
});

type State = "loading" | "ready" | "done" | "already" | "invalid" | "error";

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<State>("loading");
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok && data?.valid) { setEmail(data.email ?? ""); setState("ready"); }
        else if (data?.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState("loading");
    const r = await fetch("/email/unsubscribe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    setState(r.ok ? "done" : "error");
  };

  return (
    <div className="min-h-[80vh] grid place-items-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">First Class Fits</p>
        <h1 className="font-display text-4xl uppercase tracking-tighter mt-3">Unsubscribe</h1>

        {state === "loading" && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
        {state === "ready" && (
          <>
            <p className="mt-6 text-sm">Stop sending emails to <strong>{email}</strong>?</p>
            <button onClick={confirm} className="mt-6 w-full bg-primary text-primary-foreground py-4 text-[11px] font-bold uppercase tracking-widest">
              Confirm unsubscribe
            </button>
          </>
        )}
        {state === "done" && <p className="mt-6 text-sm">You've been unsubscribed. Sorry to see you go.</p>}
        {state === "already" && <p className="mt-6 text-sm">This email is already unsubscribed.</p>}
        {state === "invalid" && <p className="mt-6 text-sm text-muted-foreground">This link is invalid or has expired.</p>}
        {state === "error" && <p className="mt-6 text-sm text-destructive">Something went wrong. Please try again.</p>}
      </div>
    </div>
  );
}
