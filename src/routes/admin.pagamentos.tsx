import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pagamentos")({ component: AdminPayments });

function AdminPayments() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const [{ data: payments }, { data: courses }, { data: profiles }] = await Promise.all([
        supabase.from("payments").select("*").order("created_at", { ascending: false }),
        supabase.from("courses").select("id, title"),
        supabase.from("profiles").select("id, full_name")
      ]);
      return (payments ?? []).map(p => ({
        ...p,
        courses: (courses ?? []).find(c => c.id === p.course_id),
        profiles: (profiles ?? []).find(pr => pr.id === p.user_id)
      }));
    },
  });
  async function setStatus(p: any, status: "approved" | "rejected") {
    const { error } = await supabase.from("payments").update({ status }).eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    
    if (status === "approved") {
      // Also enroll the user so they get immediate access
      await supabase.from("enrollments").insert({ user_id: p.user_id, course_id: p.course_id });
    }
    
    toast.success(status === "approved" ? "Pagamento aprovado — curso liberado" : "Pagamento rejeitado"); 
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
  }
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Pagamentos</h1>
      <p className="text-sm text-muted-foreground">Métodos disponíveis: M-Pesa, e-Mola, Transferência bancária. Aprovação manual libera o curso automaticamente.</p>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Aluno</th><th className="px-4 py-3">Curso</th><th className="px-4 py-3">Método</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Referência</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Ações</th></tr></thead>
          <tbody>
            {(data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="px-4 py-3">{p.profiles?.full_name ?? "—"}</td>
                <td className="px-4 py-3">{p.courses?.title ?? "—"}</td>
                <td className="px-4 py-3 uppercase text-xs">{p.method}</td>
                <td className="px-4 py-3">{Number(p.amount_mzn).toLocaleString("pt-PT")} MT</td>
                <td className="px-4 py-3 text-muted-foreground">{p.reference ?? "—"}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs ${p.status === "approved" ? "bg-primary/10 text-primary" : p.status === "rejected" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>{p.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {p.receipt_url && (
                      <Button size="sm" variant="outline" asChild>
                        <a href={p.receipt_url} target="_blank" rel="noopener noreferrer">📄 Talão</a>
                      </Button>
                    )}
                    {p.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => setStatus(p, "approved")}>Aprovar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setStatus(p, "rejected")}>Rejeitar</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(data?.length ?? 0) === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Nenhum pagamento ainda.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}