import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logoImg from "@/assets/logo-imersao.png";
import heroBg from "@/assets/hero.jpg";
import { motion } from "framer-motion";

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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/app" }
    });
    if (error) toast.error("Falha com Google");
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      {/* Background Image & Effects */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/70 backdrop-blur-[2px]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 z-0" style={{ backgroundImage: "radial-gradient(circle at top left, rgba(234,88,12,0.15), transparent 50%)" }} />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-card/40 backdrop-blur-2xl p-10 shadow-2xl"
      >
        <Link to="/" className="mb-8 flex justify-center">
          <img src={logoImg} alt="Imersão Completa" className="h-16 w-auto object-contain drop-shadow-md invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" />
        </Link>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Criar conta</h1>
          <p className="mt-2 text-sm text-white/70">Comece grátis em 30 segundos.</p>
        </div>
        
        <button onClick={onGoogle} className="group mt-8 flex w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 py-3.5 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition-all hover:bg-white/20 hover:scale-[1.02]">
          <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Continuar com Google
        </button>
        
        <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-white/50">
          <div className="h-px flex-1 bg-white/10" />
          <span>ou</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input required placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-orange-500 focus:bg-black/40 focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-orange-500 focus:bg-black/40 focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <input type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-orange-500 focus:bg-black/40 focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <button disabled={loading} className="mt-2 w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(234,88,12,0.7)] disabled:opacity-70 disabled:hover:scale-100">
            {loading ? "A criar..." : "Criar conta"}
          </button>
        </form>
        
        <p className="mt-4 text-center text-[11px] text-white/40 leading-relaxed">
          Ao registar-se, concorda com os nossos <Link to="/termos-de-uso" className="underline hover:text-white">Termos de Uso</Link> e <Link to="/politica-de-privacidade" className="underline hover:text-white">Política de Privacidade</Link>.
        </p>
        
        <p className="mt-6 text-center text-sm font-medium text-white/70">
          Já tem conta? <Link to="/login" className="font-bold text-white transition-colors hover:text-orange-400">Entrar</Link>
        </p>
      </motion.div>
    </section>
  );
}