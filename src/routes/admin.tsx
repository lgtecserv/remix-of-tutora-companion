import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { BookOpen, Users, MessageSquare, Newspaper, DollarSign, LayoutDashboard, Settings, LogOut, GraduationCap } from "lucide-react";
import logoImg from "@/assets/logo-imersao.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Imersão Completa" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && !isAdmin) navigate({ to: "/app" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A verificar permissões...</div>;
  }

  const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/cursos", label: "Cursos", icon: BookOpen },
    { to: "/admin/alunos", label: "Alunos", icon: Users },
    { to: "/admin/comentarios", label: "Comentários", icon: MessageSquare },
    { to: "/admin/blog", label: "Blog", icon: Newspaper },
    { to: "/admin/pagamentos", label: "Pagamentos", icon: DollarSign },
    { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="hidden w-64 flex-col border-r border-border bg-secondary text-secondary-foreground md:flex">
        <div className="border-b border-border/20 p-5">
          <Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-10 brightness-0 invert" /></Link>
          <div className="mt-2 text-xs font-medium uppercase tracking-wider text-primary">Painel Admin</div>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.label} to={n.to as string} className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                active ? "bg-primary text-primary-foreground" : "text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground"
              )}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
          <Link to="/app" className="mt-4 flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-white/10">
            <GraduationCap className="h-4 w-4" />Ver como Aluno
          </Link>
        </nav>
        <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground">
          <LogOut className="h-4 w-4" />Sair
        </button>
      </aside>
      <main className="flex-1 overflow-x-hidden p-6 md:p-10"><Outlet /></main>
    </div>
  );
}