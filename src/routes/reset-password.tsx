import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Nova senha — Imersão Completa" }] }),
  component: () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const onSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password });
      setLoading(false);
      if (error) toast.error(error.message);
      else { toast.success("Senha atualizada!"); navigate({ to: "/app" }); }
    };
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted px-4">
        <form onSubmit={onSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold text-secondary">Definir nova senha</h1>
          <input type="password" required minLength={6} placeholder="Nova senha" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-6 w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:border-primary focus:outline-none" />
          <button disabled={loading} className="mt-3 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary-glow disabled:opacity-60">
            {loading ? "A guardar..." : "Guardar"}
          </button>
        </form>
      </div>
    );
  },
});