import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import logoImg from "@/assets/logo-imersao.png";
import { Home, BookOpen, Newspaper, User, Settings, LogOut, Shield, Compass, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import NotificationBell from "@/components/notification-bell";
import { RouteErrorBoundary } from "@/components/route-error-boundary";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Painel do Aluno — Imersão Completa" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && isAdmin) navigate({ to: "/admin" });
  }, [loading, user, isAdmin, navigate]);

  // Still loading auth state
  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  // Not logged in or is admin — will redirect
  if (!user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A redirecionar...</div>;
  }

  const nav: { to: string; label: string; icon: typeof Home; exact?: boolean }[] = [
    { to: "/app", label: "Início", icon: Home, exact: true },
    { to: "/app/catalogo", label: "Catálogo", icon: Compass },
    { to: "/app/cursos", label: "Meus Cursos", icon: BookOpen },
    { to: "/app/blog", label: "Blog", icon: Newspaper },
    { to: "/app/perfil", label: "Perfil", icon: User },
    { to: "/app/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-background pb-20 md:pb-0 pt-16 md:pt-0">
      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between border-b border-border bg-card/75 backdrop-blur-xl px-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-16 w-auto object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" /></Link>
        <NotificationBell />
      </header>

      <aside className="hidden w-64 flex-col border-r border-border bg-card/50 backdrop-blur-xl md:flex z-50">
        <div className="border-b border-border p-5 flex items-center justify-between gap-3">
          <div>
            <Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-32 w-auto object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" /></Link>
            <div className="mt-2 text-xs font-medium uppercase tracking-wider text-primary">Área do Aluno</div>
          </div>
          <div className="flex-shrink-0">
            <NotificationBell />
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.label} to={n.to as string} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted hover:text-primary"
              )}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin" className="mt-4 flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20">
              <Shield className="h-4 w-4" />Ir para Painel Admin
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
      <main className="flex-1 overflow-x-hidden p-4 md:p-10 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both"><RouteErrorBoundary><Outlet /></RouteErrorBoundary></main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-card/70 backdrop-blur-2xl px-1 pb-safe pt-2 shadow-[0_-4px_25px_rgba(0,0,0,0.5)]">
        {nav.filter(n => ["Início", "Catálogo", "Meus Cursos", "Perfil"].includes(n.label)).map((n) => {
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
  );
}