import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/saques")({
  component: AdminWithdrawals,
});

function AdminWithdrawals() {
  const qc = useQueryClient();
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const { data: withdrawals, isLoading } = useQuery({
    queryKey: ["admin-withdrawals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutor_withdrawals")
        .select(`
          *,
          profiles:tutor_id(full_name, email, phone)
        `)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      // As novas colunas payment_method e payment_number já vêm da tabela tutor_withdrawals.
      return data || [];
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, status, tutorId, amount }: { id: string, status: "completed" | "rejected", tutorId: string, amount: number }) => {
      // Begin transaction-like approach
      
      // Update withdrawal status
      const { error: wError } = await supabase
        .from("tutor_withdrawals")
        .update({ status, processed_at: new Date().toISOString() })
        .eq("id", id);
      if (wError) throw wError;

      // If approved, we need to subtract the amount from the tutor_wallet
      if (status === "completed") {
        // Find current wallet balance
        const { data: wallet, error: fetchErr } = await supabase
          .from("tutor_wallet")
          .select("balance")
          .eq("tutor_id", tutorId)
          .single();
        if (fetchErr) throw fetchErr;

        // Decrease balance
        const newBalance = Math.max(0, wallet.balance - amount);
        const { error: updateErr } = await supabase
          .from("tutor_wallet")
          .update({ balance: newBalance })
          .eq("tutor_id", tutorId);
        if (updateErr) throw updateErr;
      }

      return true;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === "completed" ? "Saque marcado como enviado e saldo deduzido!" : "Saque rejeitado.");
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      setSelectedWithdrawal(null);
      setActionType(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Gestão de Saques</h1>
      <p className="text-muted-foreground">Efetue o pagamento manual (via M-Pesa/e-Mola) usando o número indicado e depois aprove aqui.</p>

      {isLoading ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tutor</th>
                <th className="px-4 py-3">Método Solicitado</th>
                <th className="px-4 py-3">Número a Pagar</th>
                <th className="px-4 py-3 text-right">Valor (MT)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {withdrawals?.map((w) => (
                <tr key={w.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{w.profiles?.full_name || "Desconhecido"}</p>
                    <p className="text-xs text-muted-foreground">{w.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      {w.payment_method || "N/D"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">
                    {w.payment_number || "N/D"}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {Number(w.amount).toLocaleString('pt-PT')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      w.status === 'completed' ? 'bg-green-500/10 text-green-600' :
                      w.status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                      'bg-orange-500/10 text-orange-600'
                    }`}>
                      {w.status === 'completed' ? 'Pago' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {w.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-green-500/20 text-green-600 hover:bg-green-500/10 hover:text-green-700"
                          onClick={() => { setSelectedWithdrawal(w); setActionType('approve'); }}
                        >
                          <CheckCircle className="mr-1 h-4 w-4" /> ENVIADO
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-700"
                          onClick={() => { setSelectedWithdrawal(w); setActionType('reject'); }}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        {w.status === 'completed' ? 'Finalizado' : 'Cancelado'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              
              {withdrawals?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum pedido de saque encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedWithdrawal} onOpenChange={(open) => !open && setSelectedWithdrawal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Confirmar Pagamento' : 'Rejeitar Saque'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' ? (
                <>
                  Confirma que já transferiu <strong>{selectedWithdrawal?.amount} MT</strong> via {selectedWithdrawal?.payment_method} para o número <strong>{selectedWithdrawal?.payment_number}</strong>? 
                  <br/><br/>
                  Ao clicar em Enviar, este valor será descontado automaticamente do saldo do tutor.
                </>
              ) : (
                'Tem certeza que deseja rejeitar este saque? O tutor poderá solicitar novamente mais tarde.'
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setSelectedWithdrawal(null)} disabled={processMutation.isPending}>
              Cancelar
            </Button>
            <Button 
              variant={actionType === 'approve' ? 'default' : 'destructive'}
              className={actionType === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              disabled={processMutation.isPending}
              onClick={() => processMutation.mutate({
                id: selectedWithdrawal.id,
                status: actionType === 'approve' ? 'completed' : 'rejected',
                tutorId: selectedWithdrawal.tutor_id,
                amount: selectedWithdrawal.amount
              })}
            >
              {processMutation.isPending ? 'A Processar...' : actionType === 'approve' ? 'Sim, já enviei' : 'Rejeitar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
