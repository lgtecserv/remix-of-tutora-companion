import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logoImg from "@/assets/logo-imersao.png";

export const Route = createFileRoute("/registo")({
  head: () => ({
    meta: [
      { title: "Criar conta — Imersão Completa" },
      { name: "description", content: "Crie a sua conta gratuita na Imersão Completa e comece a aprender." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + "/app", data: { full_name: name } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique o seu email.");
    navigate({ to: "/login" });
  };

  const onGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/app" });
    if (result.error) toast.error("Falha com Google");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/80 backdrop-blur-xl p-8 shadow-[var(--shadow-card)] animate-in fade-in zoom-in-95 duration-500">
        <Link to="/" className="mb-6 flex justify-center"><img src={logoImg} alt="Imersão Completa" className="h-20 w-auto object-contain invert brightness-0" /></Link>
        <h1 className="text-center text-2xl font-bold text-secondary">Criar conta</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Comece grátis em 30 segundos.</p>
        <button onClick={onGoogle} className="mt-6 w-full rounded-full border border-border bg-background py-3 text-sm font-semibold transition hover:bg-muted">
          Continuar com Google
        </button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border" />ou<div className="h-px flex-1 bg-border" /></div>
        <form onSubmit={onSubmit} className="space-y-3">
          <input required placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <input type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <button disabled={loading} className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-glow disabled:opacity-60">
            {loading ? "A criar..." : "Criar conta"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">Já tem conta? <Link to="/login" className="text-primary hover:underline">Entrar</Link></p>
      </div>
    </div>
  );
}