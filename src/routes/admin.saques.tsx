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
      return data;
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, status, tutorId, amount }: { id: string, status: "completed" | "rejected", tutorId: string, amount: number }) => {
      // Begin transaction-like approach (Since we don't have rpc transactions set up for this yet)
      
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
      toast.success(variables.status === "completed" ? "Saque aprovado e saldo deduzido." : "Saque rejeitado.");
      qc.invalidateQueries({ queryKey: ["admin-withdrawals"] });
      setSelectedWithdrawal(null);
      setActionType(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Gestão de Saques</h1>
      <p className="text-muted-foreground">Efetue o pagamento manual (via M-Pesa/e-Mola/Banco) e depois aprove aqui.</p>

      {isLoading ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Tutor</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Valor (MT)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(withdrawals ?? []).map((w: any) => (
                <tr key={w.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(w.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {w.profiles?.full_name || w.profiles?.email}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {w.profiles?.phone || "Não definido"}
                  </td>
                  <td className="px-4 py-3 font-bold text-primary">
                    {w.amount}
                  </td>
                  <td className="px-4 py-3">
                    {w.status === "completed" && <span className="text-green-500 font-semibold">Concluído</span>}
                    {w.status === "pending" && <span className="text-orange-500 font-semibold">Pendente</span>}
                    {w.status === "rejected" && <span className="text-red-500 font-semibold">Rejeitado</span>}
                  </td>
                  <td className="px-4 py-3">
                    {w.status === "pending" && (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => { setSelectedWithdrawal(w); setActionType("approve"); }}
                          title="Aprovar Pagamento"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => { setSelectedWithdrawal(w); setActionType("reject"); }}
                          title="Rejeitar Pagamento"
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum saque encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedWithdrawal && actionType && (
        <Dialog open onOpenChange={(open) => !open && setSelectedWithdrawal(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" ? "Aprovar Saque" : "Rejeitar Saque"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" 
                  ? "Certifique-se de que já efetuou a transferência do valor para o tutor antes de aprovar. Esta ação irá descontar o valor da carteira do tutor."
                  : "Tem a certeza que deseja rejeitar este pedido de saque? O saldo do tutor não será alterado."
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="bg-muted p-4 rounded-xl space-y-2">
                <p className="text-sm"><strong>Tutor:</strong> {selectedWithdrawal.profiles?.full_name}</p>
                <p className="text-sm"><strong>Telefone (M-Pesa/e-Mola):</strong> {selectedWithdrawal.profiles?.phone}</p>
                <p className="text-sm"><strong>Valor a transferir:</strong> <span className="font-bold text-lg text-primary">{selectedWithdrawal.amount} MT</span></p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedWithdrawal(null)}>Cancelar</Button>
                <Button 
                  className={`flex-1 text-white ${actionType === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
                  onClick={() => processMutation.mutate({ 
                    id: selectedWithdrawal.id, 
                    status: actionType === "approve" ? "completed" : "rejected",
                    tutorId: selectedWithdrawal.tutor_id,
                    amount: selectedWithdrawal.amount
                  })}
                  disabled={processMutation.isPending}
                >
                  {processMutation.isPending ? "A processar..." : actionType === "approve" ? "Confirmar Pagamento Realizado" : "Rejeitar Saque"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
