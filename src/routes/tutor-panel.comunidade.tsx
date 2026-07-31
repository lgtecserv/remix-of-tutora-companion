import { createFileRoute } from "@tanstack/react-router";
import { PostFeed } from "@/components/community/PostFeed";
import { Users } from "lucide-react";

export const Route = createFileRoute("/tutor-panel/comunidade")({
  head: () => ({ meta: [{ title: "Comunidade — Tutor" }] }),
  component: TutorComunidadePage,
});

function TutorComunidadePage() {
  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-xl">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Comunidade Global</h1>
          <p className="text-muted-foreground mt-1">
            Compartilhe ideias, tire dúvidas e faça networking com outros alunos e tutores.
          </p>
        </div>
      </div>
      
      <PostFeed />
    </div>
  );
}
