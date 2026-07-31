import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { FileText, CheckCircle, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/tutor-panel/pagamentos")({ component: TutorPayments });

function TutorPayments() {
  const { user } = useAuth();
  
  const { data, isLoading } = useQuery({
    queryKey: ["tutor-student-payments", user?.id],
    enabled: !!user,
    queryFn: async () => {
      // Fetch courses belonging to this tutor
      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .eq("tutor_id", user!.id);
        
      if (!courses || courses.length === 0) return [];
      
      const courseIds = courses.map(c => c.id);

      // Fetch payments for these courses
      const { data: payments } = await supabase
        .from("payments")
        .select("*")
        .in("course_id", courseIds)
        .order("created_at", { ascending: false });
        
      // Fetch student profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name");

      return (payments ?? []).map(p => ({
        ...p,
        courses: courses.find(c => c.id === p.course_id),
        profiles: (profiles ?? []).find(pr => pr.id === p.user_id)
      }));
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pagamentos de Alunos</h1>
        <p className="text-muted-foreground mt-1">Acompanhe os comprovativos enviados pelos alunos que compraram os seus cursos. A aprovação é feita pelo Administrador.</p>
      </div>
      
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Aluno</th>
              <th className="px-4 py-3">Curso</th>
              <th className="px-4 py-3">Método</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Comprovativo</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-muted-foreground animate-pulse">A carregar pagamentos...</td></tr>
            ) : (data ?? []).map((p: any) => (
              <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                <td className="px-4 py-4 font-medium">{p.profiles?.full_name ?? "—"}</td>
                <td className="px-4 py-4">{p.courses?.title ?? "—"}</td>
                <td className="px-4 py-4 uppercase text-xs font-semibold">{p.method}</td>
                <td className="px-4 py-4">{Number(p.amount_mzn).toLocaleString("pt-PT")} MT</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    p.status === "approved" ? "bg-green-500/10 text-green-600" : 
                    p.status === "rejected" ? "bg-red-500/10 text-red-600" : 
                    "bg-orange-500/10 text-orange-600"
                  }`}>
                    {p.status === "approved" && <CheckCircle className="w-3.5 h-3.5" />}
                    {p.status === "pending" && <Clock className="w-3.5 h-3.5" />}
                    {p.status === "rejected" && <XCircle className="w-3.5 h-3.5" />}
                    {p.status === "approved" ? "Aprovado" : p.status === "pending" ? "Pendente" : "Rejeitado"}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {p.receipt_url ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="gap-2">
                        <FileText className="w-4 h-4 text-primary" /> Ver Talão
                      </a>
                    </Button>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Sem talão</span>
                  )}
                </td>
              </tr>
            ))}
            {!isLoading && (data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <FileText className="h-10 w-10 mb-3 opacity-20" />
                    <p>Ainda não há pagamentos para os seus cursos.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
