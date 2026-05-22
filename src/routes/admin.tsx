import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { BookOpen, Users, MessageSquare, Newspaper, DollarSign, LayoutDashboard, Settings } from "lucide-react";
import logoImg from "@/assets/logo-imersao.png";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Imersão Completa" }, { name: "robots", content: "noindex" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
    if (!loading && user && !isAdmin) navigate({ to: "/app" });
  }, [loading, user, isAdmin, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">A verificar permissões...</div>;
  }

  const cards = [
    { icon: BookOpen, label: "Cursos", desc: "Criar, editar, publicar" },
    { icon: LayoutDashboard, label: "Aulas", desc: "Vídeos, ordem, módulos" },
    { icon: Users, label: "Alunos", desc: "Gestão de utilizadores" },
    { icon: MessageSquare, label: "Comentários", desc: "Moderação" },
    { icon: Newspaper, label: "Blog", desc: "Artigos e SEO" },
    { icon: DollarSign, label: "Pagamentos", desc: "Aprovar M-Pesa / e-Mola" },
    { icon: Settings, label: "Configurações", desc: "Plataforma" },
  ];

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-9" /></Link>
          <Link to="/app" className="text-sm text-primary hover:underline">Voltar ao app</Link>
        </div>
      </header>
      <main className="container mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-secondary">Painel Administrativo</h1>
        <p className="mt-1 text-muted-foreground">Em construção — fase 3 do roadmap.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {cards.map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-[var(--shadow-card)]">
              <c.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-semibold text-secondary">{c.label}</h3>
              <p className="text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}