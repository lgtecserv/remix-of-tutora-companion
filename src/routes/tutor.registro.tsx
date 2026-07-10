import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoImg from "@/assets/logo-imersao.png";
import heroBg from "@/assets/hero.jpg";
import { motion } from "framer-motion";

export const Route = createFileRoute("/tutor/registro")({
  head: () => ({
    meta: [
      { title: "Torne-se um Tutor — Imersão Completa" },
      { name: "description", content: "Registe-se como tutor e comece a rentabilizar o seu conhecimento." },
    ],
  }),
  component: TutorSignupPage,
});

function TutorSignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // 1. Criar conta
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + "/tutor/pagamento", data: { full_name: name } },
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // 2. Marcar como tutor no profile
        await supabase
          .from('profiles')
          .update({ is_tutor: true })
          .eq('id', authData.user.id);
          
        // 3. Criar application pendente
        const { error: appError } = await supabase
          .from('tutor_applications')
          .insert({ user_id: authData.user.id, status: 'pending' });
          
        if (appError) {
          // Ignora se já existir
          console.warn("Tutor application warning:", appError);
        }
      }

      toast.success("Conta de Tutor criada! Verifique o seu email.");
      navigate({ to: "/tutor/pagamento" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-8">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/80 backdrop-blur-[4px]" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-primary/20 bg-card/60 backdrop-blur-3xl p-10 shadow-2xl"
      >
        <Link to="/" className="mb-8 flex justify-center">
          <img src={logoImg} alt="Imersão Completa" className="h-16 w-auto object-contain drop-shadow-md invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" />
        </Link>
        <div className="text-center mb-6">
          <span className="inline-block py-1 px-3 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-3 border border-primary/30">
            Portal do Tutor
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Ensine e Fature</h1>
          <p className="mt-3 text-sm text-white/80 leading-relaxed">
            Junte-se ao marketplace da Imersão Completa. Venda os seus cursos, fique com 90% dos lucros.
          </p>
        </div>
        
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-6">
          <h3 className="text-primary font-semibold text-sm mb-2">Como funciona?</h3>
          <ul className="text-xs text-white/70 space-y-2 list-disc list-inside">
            <li>Crie a sua conta de Tutor agora.</li>
            <li>Pague a taxa de adesão única de <strong>500 MT</strong>.</li>
            <li>Tenha o seu painel exclusivo para criar e vender cursos.</li>
          </ul>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <input required placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-primary focus:bg-black/60 focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-primary focus:bg-black/60 focus:ring-2 focus:ring-primary/30" />
          </div>
          <div>
            <input type="password" required minLength={6} placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all focus:border-primary focus:bg-black/60 focus:ring-2 focus:ring-primary/30" />
          </div>
          <button disabled={loading} className="mt-4 w-full rounded-xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-[0_0_20px_-5px_var(--color-primary)] transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_-5px_var(--color-primary)] disabled:opacity-70 disabled:hover:scale-100">
            {loading ? "A processar..." : "Registar como Tutor"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-[11px] text-white/40 leading-relaxed">
          Ao registar-se, tem até 48H para efetuar o pagamento da adesão, caso contrário a sua aplicação expirará automaticamente.
        </p>
      </motion.div>
    </section>
  );
}
