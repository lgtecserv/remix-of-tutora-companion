import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { toast } from "sonner";
import logoImg from "@/assets/logo-imersao.png";
import heroBg from "@/assets/hero.jpg";
import { useAuth } from "@/lib/auth";
import { motion } from "framer-motion";

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
  const { user, isAdmin, isTutorPending, isTutorApproved, isTutorRejected, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect immediately to prevent showing login form flash
  useEffect(() => {
    if (!authLoading && user) {
      if (isAdmin) {
        navigate({ to: "/admin" });
      } else if (isTutorPending || isTutorApproved || isTutorRejected) {
        navigate({ to: "/tutor-panel" });
      } else {
        navigate({ to: "/app" });
      }
    }
  }, [user, isAdmin, isTutorPending, isTutorApproved, isTutorRejected, authLoading, navigate]);

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
      
      const { data: appData } = await supabase
        .from("tutor_applications")
        .select("status")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (hasAdmin) {
        navigate({ to: "/admin" });
      } else if (appData && (appData.status === "pending" || appData.status === "paid" || appData.status === "rejected")) {
        navigate({ to: "/tutor-panel" });
      } else {
        navigate({ to: "/app" });
      }
    }
  };

  const onGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/app" }
    });
    if (error) toast.error("Falha ao iniciar sessão com Google");
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Background Image & Effects */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/70 backdrop-blur-[2px]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 z-0" style={{ backgroundImage: "radial-gradient(circle at top right, rgba(234,88,12,0.15), transparent 50%)" }} />

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
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Entrar</h1>
          <p className="mt-2 text-sm text-white/70">Bem-vindo de volta!</p>
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
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-orange-500 focus:bg-black/40 focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <input type="password" required placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-orange-500 focus:bg-black/40 focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <button disabled={loading} className="mt-2 w-full rounded-full bg-gradient-to-r from-orange-500 to-red-600 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_-5px_rgba(234,88,12,0.5)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_rgba(234,88,12,0.7)] disabled:opacity-70 disabled:hover:scale-100">
            {loading ? "A entrar..." : "Entrar"}
          </button>
        </form>
        
        <div className="mt-6 flex justify-between text-sm font-medium text-white/70">
          <Link to="/recuperar-senha" className="transition-colors hover:text-orange-400">Esqueci a senha</Link>
          <Link to="/registo" className="transition-colors hover:text-orange-400">Criar conta</Link>
        </div>
      </motion.div>
    </section>
  );
}