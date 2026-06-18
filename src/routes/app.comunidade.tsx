import { createFileRoute } from "@tanstack/react-router";
import { PostFeed } from "@/components/community/PostFeed";

export const Route = createFileRoute("/app/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade — Imersão Completa" }] }),
  component: ComunidadePage,
});

function ComunidadePage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Comunidade</h1>
        <p className="text-muted-foreground mt-2">
          Compartilhe ideias, tire dúvidas e faça networking com outros alunos da Imersão Completa.
        </p>
      </div>
      
      <PostFeed />
    </div>
  );
}
