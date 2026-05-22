import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/comentarios")({ component: AdminComments });

function AdminComments() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => (await supabase.from("comments").select("*, profiles(full_name), lessons(title, modules(courses(title)))").order("created_at", { ascending: false })).data ?? [],
  });
  async function toggleHide(c: any) {
    const { error } = await supabase.from("comments").update({ is_hidden: !c.is_hidden }).eq("id", c.id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin-comments"] });
  }
  async function remove(c: any) {
    if (!confirm("Excluir comentário?")) return;
    await supabase.from("comments").delete().eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["admin-comments"] });
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-secondary">Comentários</h1>
      <div className="space-y-3">
        {(data ?? []).map((c: any) => (
          <div key={c.id} className={`rounded-2xl border border-border bg-card p-4 ${c.is_hidden ? "opacity-50" : ""}`}>
            <div className="text-xs text-muted-foreground">{c.profiles?.full_name ?? "Aluno"} · {c.lessons?.modules?.courses?.title} → {c.lessons?.title} · {new Date(c.created_at).toLocaleString("pt-PT")}</div>
            <div className="mt-1 text-sm text-secondary whitespace-pre-wrap">{c.content}</div>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" onClick={() => toggleHide(c)}>{c.is_hidden ? <><Eye className="h-4 w-4" />Mostrar</> : <><EyeOff className="h-4 w-4" />Ocultar</>}</Button>
              <Button variant="ghost" size="sm" onClick={() => remove(c)}><Trash2 className="h-4 w-4" />Excluir</Button>
            </div>
          </div>
        ))}
        {(data?.length ?? 0) === 0 && <div className="text-center text-muted-foreground py-10">Nenhum comentário ainda.</div>}
      </div>
    </div>
  );
}