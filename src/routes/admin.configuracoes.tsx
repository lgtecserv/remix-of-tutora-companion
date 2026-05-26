import { createFileRoute } from "@tanstack/react-router";
import { Settings, Search, Plug, Shield } from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes")({ component: AdminSettings });

function AdminSettings() {
  const cards = [
    { icon: Settings, title: "Plataforma", desc: "Nome, logotipo, idioma padrão." },
    { icon: Search, title: "SEO global", desc: "Meta tags, sitemap, Google Search Console." },
    { icon: Plug, title: "Integrações", desc: "M-Pesa, e-Mola, e-mail transacional, analytics." },
    { icon: Shield, title: "Segurança", desc: "Políticas de senha, 2FA, logs de auditoria." },
  ];
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
      <p className="text-muted-foreground">Configurações gerais da plataforma. Em construção.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-card p-6">
            <c.icon className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold text-foreground">{c.title}</h3>
            <p className="text-sm text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}