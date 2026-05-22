import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import logoImg from "@/assets/logo-imersao.png";
import { Home, BookOpen, Newspaper, User, Settings, LogOut, Shield, Compass } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Painel do Aluno — Imersão Completa" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
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
    <div className="flex min-h-screen bg-muted">
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-5">
          <Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-10" /></Link>
          <div className="mt-2 text-xs font-medium uppercase tracking-wider text-primary">Área do Aluno</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.label} to={n.to as string} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-primary text-primary-foreground" : "text-secondary/80 hover:bg-muted hover:text-primary"
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
        <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-secondary">
          <LogOut className="h-4 w-4" />Sair
        </button>
      </aside>
      <main className="flex-1 overflow-x-hidden p-6 md:p-10"><Outlet /></main>
    </div>
  );
}