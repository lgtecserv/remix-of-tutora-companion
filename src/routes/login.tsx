import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logoImg from "@/assets/logo-imersao.png";
import { useAuth } from "@/lib/auth";

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
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      navigate({ to: isAdmin ? "/admin" : "/app" });
    }
  }, [authLoading, user, isAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    // Check roles to decide where to send the user
    if (data.user) {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      const hasAdmin = rolesData?.some((r) => r.role === "admin");
      navigate({ to: hasAdmin ? "/admin" : "/app" });
    }
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (result.error) toast.error("Falha ao iniciar sessão com Google");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] animate-in fade-in zoom-in-95 duration-500">
        <Link to="/" className="mb-6 flex justify-center"><img src={logoImg} alt="Imersão Completa" className="h-20 w-auto object-contain invert brightness-0" /></Link>
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