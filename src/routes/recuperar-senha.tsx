import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({ meta: [{ title: "Recuperar senha — Imersão Completa" }] }),
  component: () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
      setLoading(false);
      if (error) toast.error(error.message);
      else toast.success("Verifique o seu email para redefinir a senha.");
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold text-foreground">Recuperar senha</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enviaremos um link para o seu email.</p>
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
          <button disabled={loading} className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-glow disabled:opacity-60">
            {loading ? "A enviar..." : "Enviar link"}
          </button>
          <p className="mt-4 text-center text-sm"><Link to="/login" className="text-primary hover:underline">Voltar ao login</Link></p>
        </form>
      </div>
    );
  },
});