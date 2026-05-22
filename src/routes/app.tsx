import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import logoImg from "@/assets/logo-imersao.png";
import { Home, BookOpen, Newspaper, User, Settings, LogOut, Shield } from "lucide-react";

export const Route = createFileRoute("/app")({
  head: () => ({ meta: [{ title: "Painel — Imersão Completa" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

function AppLayout() {
  const { user, loading, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A carregar...</div>;
  }

  const nav = [
    { to: "/app", label: "Início", icon: Home },
    { to: "/app", label: "Meus Cursos", icon: BookOpen },
    { to: "/app", label: "Blog", icon: Newspaper },
    { to: "/app", label: "Perfil", icon: User },
    { to: "/app", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="border-b border-border p-5"><Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-10" /></Link></div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => (
            <Link key={n.label} to={n.to} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-secondary/80 transition hover:bg-muted hover:text-primary">
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin" className="mt-4 flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20">
              <Shield className="h-4 w-4" />Painel Admin
            </Link>
          )}
        </nav>
        <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-secondary">
          <LogOut className="h-4 w-4" />Sair
        </button>
      </aside>
      <main className="flex-1 p-6 md:p-10"><Outlet /></main>
    </div>
  );
}