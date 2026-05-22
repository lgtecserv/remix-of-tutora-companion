import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { PlayCircle, BookOpen, Trophy, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: () => {
    const { user } = useAuth();
    const name = (user?.user_metadata?.full_name as string) || user?.email?.split("@")[0] || "aluno";
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Olá, {name} 👋</h1>
          <p className="mt-1 text-muted-foreground">Continue de onde parou e aprenda algo novo hoje.</p>
        </div>
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-secondary"><PlayCircle className="h-5 w-5 text-primary" />Continuar assistindo</h2>
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            Ainda não começou nenhum curso. <a href="/#cursos" className="text-primary hover:underline">Ver cursos disponíveis</a>.
          </div>
        </section>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: BookOpen, label: "Cursos em andamento", v: "0" },
            { icon: Trophy, label: "Cursos concluídos", v: "0" },
            { icon: Sparkles, label: "Horas estudadas", v: "0" },
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-6">
              <c.icon className="h-6 w-6 text-primary" />
              <div className="mt-3 text-2xl font-bold text-secondary">{c.v}</div>
              <div className="text-sm text-muted-foreground">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  },
});