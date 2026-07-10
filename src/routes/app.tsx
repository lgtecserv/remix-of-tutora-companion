import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import logoImg from "@/assets/logo-imersao.png";
import { Home, BookOpen, Newspaper, User, Settings, LogOut, Shield, Compass, Sun, Moon, Users, X, BookText, Library } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import NotificationBell from "@/components/notification-bell";
import { RouteErrorBoundary } from "@/components/route-error-boundary";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Painel do Aluno — Imersão Completa" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function GlobalBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { data: ad } = useQuery({
    queryKey: ['global_top_ad'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('community_ads')
        .select('*')
        .eq('placement', 'global_top')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    }
  });

  if (!ad || dismissed) return null;

  return (
    <div className="relative z-40 w-full mb-6 group rounded-xl overflow-hidden shadow-sm bg-primary text-primary-foreground text-sm font-medium">
      {ad.image_url ? (
        <a href={ad.link_url || "#"} target={ad.link_url ? "_blank" : undefined} rel={ad.link_url ? "noopener noreferrer" : undefined} className="block w-full">
          <img src={ad.image_url} alt={ad.title} className="w-full h-auto max-h-32 object-contain bg-black/50" />
        </a>
      ) : (
        <div className="px-4 py-3 flex items-center justify-center">
          <div className="flex items-center gap-2 max-w-[90%] text-center">
            <span>{ad.title}</span>
            {ad.description && <span className="hidden md:inline opacity-90 font-normal">- {ad.description}</span>}
            {ad.link_url && (
              <a href={ad.link_url} target="_blank" rel="noopener noreferrer" className="underline font-bold ml-2 hover:opacity-80">
                Acessar
              </a>
            )}
          </div>
        </div>
      )}
      <button onClick={() => setDismissed(true)} className="absolute right-3 top-3 p-1.5 bg-black/50 text-white hover:bg-black/80 rounded-full transition-colors backdrop-blur-sm z-10">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function AppLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme } = useTheme();

  const { data: profile } = useQuery({
    queryKey: ['profile-tutor-check', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('is_tutor').eq('id', user.id).single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [loading, user, isAdmin, navigate]);

  if (loading) {
    return <div suppressHydrationWarning className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A redirecionar...</div>;
  }

  const nav: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
    { to: "/app", label: "Início", icon: Home, exact: true },
    { to: "/app/catalogo", label: "Catálogo", icon: Compass },
    { to: "/app/cursos", label: "Meus Cursos", icon: BookOpen },
    { to: "/app/biblioteca", label: "Biblioteca", icon: Library },
    { to: "/ebooks", label: "E-books", icon: BookText },
    { to: "/app/comunidade", label: "Comunidade", icon: Users },
    { to: "/app/blog", label: "Blog", icon: Newspaper },
    { to: "/app/perfil", label: "Perfil", icon: User },
    { to: "/app/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="flex flex-1 pb-20 md:pb-0 relative">
        {/* Mobile Top Bar */}
        <header className="md:hidden sticky top-0 left-0 right-0 h-16 z-40 flex items-center justify-between border-b border-border bg-card/75 backdrop-blur-xl px-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] w-full">
          <Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-12 w-auto object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" /></Link>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className="p-2 text-muted-foreground hover:bg-muted hover:text-foreground rounded-full transition-colors" title="Sair">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <aside className="hidden w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl md:flex z-50 h-[100dvh] sticky top-0">
          <div className="border-b border-border p-5 flex items-center justify-between gap-3">
            <div>
              <Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-32 w-auto object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" /></Link>
              <div className="mt-2 text-xs font-medium uppercase tracking-wider text-primary">Área do Aluno</div>
            </div>
            <div className="flex-shrink-0">
              <NotificationBell />
            </div>
          </div>
          <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
            {nav.map((n) => {
              const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
              return (
                <Link key={n.label} to={n.to as string} className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                  active ? "text-primary" : "text-foreground/70 hover:text-foreground"
                )}>
                  {active && (
                    <div className="absolute inset-0 rounded-xl bg-primary/10 shadow-[inset_0_0_12px_rgba(234,88,12,0.1)]" />
                  )}
                  {active && (
                    <div className="absolute left-0 top-1/2 -mt-2 h-4 w-1 rounded-r-full bg-primary" />
                  )}
                  <n.icon className={cn("relative z-10 h-5 w-5 transition-transform duration-300", active ? "scale-110" : "group-hover:scale-110 group-hover:text-primary")} />
                  <span className="relative z-10">{n.label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <Link to="/admin" className="mt-4 flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20">
                <Shield className="h-4 w-4" />Ir para Painel Admin
              </Link>
            )}
            {!isAdmin && profile?.is_tutor && (
              <Link to="/tutor-panel" className="mt-4 flex items-center gap-3 rounded-lg bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-500 transition hover:bg-blue-500/20">
                <BookOpen className="h-4 w-4" />Ir para Painel Tutor
              </Link>
            )}
            {!isAdmin && !profile?.is_tutor && (
              <Link to="/tutor/registro" className="mt-4 flex items-center gap-3 rounded-lg border border-primary/20 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/10">
                <Users className="h-4 w-4" />Tornar-se Tutor
              </Link>
            )}
          </nav>
          
          <div className="mt-auto border-t border-border p-3 space-y-1">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>Tema {theme === 'dark' ? 'Claro' : 'Escuro'}</span>
            </button>
            <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              <LogOut className="h-4 w-4" />Sair
            </button>
          </div>
        </aside>

        <main className="flex-1 overflow-x-hidden p-4 md:p-10 pb-8 flex flex-col">
          <GlobalBanner />
          <RouteErrorBoundary>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </RouteErrorBoundary>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/70 backdrop-blur-2xl px-1 pb-safe pt-2 shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
          {nav.filter(n => ["Início", "Catálogo", "Meus Cursos", "Comunidade"].includes(n.label)).map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.label} to={n.to as string} className={cn(
                "flex flex-col items-center justify-center p-2 text-[10px] font-medium transition-all",
                active ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}>
                <div className={cn("p-1.5 rounded-full mb-1 transition-colors", active && "bg-primary/10")}>
                  <n.icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                </div>
                <span className="truncate w-full text-center">{n.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}