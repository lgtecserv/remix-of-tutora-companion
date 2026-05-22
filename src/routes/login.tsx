import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logoImg from "@/assets/logo-imersao.png";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Imersão Completa" },
      { name: "description", content: "Aceda à sua conta na Imersão Completa." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    navigate({ to: "/app" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (result.error) toast.error("Falha ao iniciar sessão com Google");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
        <Link to="/" className="mb-6 flex justify-center"><img src={logoImg} alt="Imersão Completa" className="h-12" /></Link>
        <h1 className="text-center text-2xl font-bold text-secondary">Entrar</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Bem-vindo de volta!</p>
        <button onClick={onGoogle} className="mt-6 w-full rounded-full border border-border bg-background py-3 text-sm font-semibold transition hover:bg-muted">
          Continuar com Google
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ou<div className="h-px flex-1 bg-border" /></div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <input type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <button disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-glow disabled:opacity-60">
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link to="/recuperar-senha" className="text-primary hover:underline">Esqueci a senha</Link>
          <Link to="/registo" className="text-primary hover:underline">Criar conta</Link>
        </div>
      </div>
    </div>
  );
}