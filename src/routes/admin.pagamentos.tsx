import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Eye, ExternalLink, CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Route = createFileRoute("/admin/pagamentos")({ component: AdminPayments });

function AdminPayments() {
  const qc = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from("payments")
        .select(`
          *,
          student:profiles!payments_user_id_fkey(id, full_name, email),
          course:courses!payments_course_id_fkey(
            id, title, tutor_id, instructor_id,
            tutor:profiles!courses_tutor_id_fkey(id, full_name, email),
            instructor:profiles!courses_instructor_id_fkey(id, full_name, email)
          )
        `)
        .order("created_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching payments:", error);
        throw error;
      }
      
      return (payments ?? []).map((p: any) => {
        // Supabase might return array or single object depending on foreign keys. Let's normalize.
        const student = Array.isArray(p.student) ? p.student[0] : p.student;
        const course = Array.isArray(p.course) ? p.course[0] : p.course;
        
        let tutor = null;
        if (course) {
          const courseTutor = Array.isArray(course.tutor) ? course.tutor[0] : course.tutor;
          const courseInstructor = Array.isArray(course.instructor) ? course.instructor[0] : course.instructor;
          tutor = courseTutor || courseInstructor;
        }

        return {
          ...p,
          course: course,
          student: student,
          tutor: tutor
        };
      });
    },
  });

  async function setStatus(p: any, status: "approved" | "rejected") {
    const { error } = await supabase.from("payments").update({ status }).eq("id", p.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    
    if (status === "approved") {
      // Enroll the user so they get immediate access
      await supabase.from("enrollments").insert({ user_id: p.user_id, course_id: p.course_id });
      
      // Calculate 85% of the payment amount for the tutor
      const tutorShare = Number(p.amount_mzn) * 0.85;
      const tutorId = p.course?.tutor_id || p.course?.instructor_id;
      
      if (tutorId && tutorShare > 0) {
        // Fetch current wallet
        const { data: wallet } = await supabase.from("tutor_wallet").select("*").eq("tutor_id", tutorId).single();
        
        if (wallet) {
          await supabase.from("tutor_wallet").update({
            balance: Number(wallet.balance) + tutorShare,
            total_earned: Number(wallet.total_earned) + tutorShare
          }).eq("tutor_id", tutorId);
        } else {
          await supabase.from("tutor_wallet").insert({
            tutor_id: tutorId,
            balance: tutorShare,
            total_earned: tutorShare
          });
        }
      }
    }
    
    toast.success(status === "approved" ? "Pagamento aprovado — curso liberado e 85% adicionado à carteira do tutor" : "Pagamento rejeitado"); 
    qc.invalidateQueries({ queryKey: ["admin-payments"] });
    setSelectedPayment(null);
  }

  const isImage = (url: string | null) => {
    if (!url) return false;
    return url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp)$/) != null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Pagamentos e Inscrições</h1>
        <p className="text-sm text-muted-foreground mt-1">Aprove comprovativos manuais para libertar o curso ao aluno e creditar o tutor.</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm whitespace-nowrap">
          <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-4">Data</th>
              <th className="px-5 py-4">Aluno</th>
              <th className="px-5 py-4">Curso</th>
              <th className="px-5 py-4">Tutor</th>
              <th className="px-5 py-4">Valor</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">A carregar...</td></tr>
            ) : (data?.length ?? 0) === 0 ? (
              <tr><td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">Nenhum pagamento ainda.</td></tr>
            ) : (
              (data ?? []).map((p: any) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {p.student?.full_name || p.student?.email || "Desconhecido"}
                  </td>
                  <td className="px-5 py-4 truncate max-w-[200px]" title={p.course?.title}>
                    {p.course?.title ?? "Desconhecido"}
                  </td>
                  <td className="px-5 py-4">
                    {p.tutor ? (
                      <Badge variant="outline" className="font-normal bg-blue-500/10 text-blue-600 border-blue-500/20">
                        {p.tutor.full_name || p.tutor.email}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Plataforma</span>
                    )}
                  </td>
                  <td className="px-5 py-4 font-bold text-primary">
                    {Number(p.amount_mzn).toLocaleString("pt-PT")} MT
                  </td>
                  <td className="px-5 py-4">
                    {p.status === "approved" && <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 shadow-none border-0">Aprovado</Badge>}
                    {p.status === "rejected" && <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 shadow-none border-0">Rejeitado</Badge>}
                    {p.status === "pending" && <Badge className="bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 shadow-none border-0">Pendente</Badge>}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Button size="sm" variant="secondary" className="gap-2" onClick={() => setSelectedPayment(p)}>
                      <Eye className="w-4 h-4" /> Detalhes
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Detalhes do Pagamento</DialogTitle>
            <DialogDescription>Reveja os dados e o comprovativo abaixo antes de aprovar.</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedPayment && (
              <div className="space-y-6 pt-2">
                {/* Information Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Aluno</p>
                    <p className="font-medium">{selectedPayment.student?.full_name || selectedPayment.student?.email || "Desconhecido"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Curso</p>
                    <p className="font-medium">{selectedPayment.course?.title || "Desconhecido"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Tutor a Receber</p>
                    <p className="font-medium">{selectedPayment.tutor?.full_name || selectedPayment.tutor?.email || "Nenhum (Receita da Plataforma)"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-muted-foreground">Valor e Método</p>
                    <p className="font-bold text-primary">{Number(selectedPayment.amount_mzn).toLocaleString("pt-PT")} MT <span className="text-muted-foreground font-normal ml-2 uppercase text-xs">({selectedPayment.method})</span></p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm font-semibold text-muted-foreground">Referência da Transação</p>
                    <p className="font-mono text-xs bg-muted p-2 rounded-md break-all">{selectedPayment.reference || "Sem referência"}</p>
                  </div>
                </div>

                {/* Comprovativo */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                    <span>Comprovativo Anexado</span>
                    {selectedPayment.receipt_url && (
                      <a href={selectedPayment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                        Abrir Externamente <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </p>
                  
                  {selectedPayment.receipt_url ? (
                    <div className="rounded-xl overflow-hidden border bg-muted/30 flex items-center justify-center min-h-[200px]">
                      {isImage(selectedPayment.receipt_url) ? (
                        <img src={selectedPayment.receipt_url} alt="Comprovativo" className="max-w-full h-auto object-contain max-h-[400px]" />
                      ) : (
                        <div className="p-8 text-center">
                          <p className="mb-4">Este ficheiro pode ser um PDF ou outro formato.</p>
                          <Button asChild variant="outline">
                            <a href={selectedPayment.receipt_url} target="_blank" rel="noopener noreferrer">Descarregar Ficheiro</a>
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground bg-muted/10">
                      Nenhum comprovativo anexado pelo aluno.
                    </div>
                  )}
                </div>
              </div>
            )}
          </ScrollArea>

          {selectedPayment?.status === "pending" && (
            <DialogFooter className="gap-2 sm:gap-0 border-t pt-4 mt-2">
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => setStatus(selectedPayment, "rejected")}>
                <XCircle className="w-4 h-4 mr-2" /> Rejeitar
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => setStatus(selectedPayment, "approved")}>
                <CheckCircle className="w-4 h-4 mr-2" /> Aprovar e Liberar Curso
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}