import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, ArrowDownRight, ArrowUpRight, Clock, CheckCircle, XCircle } from "lucide-react";

export const Route = createFileRoute("/tutor-panel/financeiro")({
  component: TutorWallet,
});

function TutorWallet() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["tutor-wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("tutor_wallet")
        .select("*")
        .eq("tutor_id", user.id)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data || { balance: 0, total_earned: 0 };
    },
    enabled: !!user,
  });

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ["tutor-withdrawals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tutor_withdrawals")
        .select("*")
        .eq("tutor_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const val = parseFloat(amount);
      if (isNaN(val) || val <= 0) throw new Error("Valor inválido");
      if (val > (wallet?.balance || 0)) throw new Error("Saldo insuficiente");

      // We don't decrease balance here; the admin will do it when approving,
      // OR we decrease it here and revert if rejected. Standard practice is 
      // decrease immediately (or set status pending so it blocks balance).
      // Since we don't have a transaction system here, we will just create the request
      // but warn the user that balance is reserved.
      // A better way is to compute available_balance = balance - sum(pending withdrawals).
      
      const { error } = await supabase
        .from("tutor_withdrawals")
        .insert({ tutor_id: user.id, amount: val, status: "pending" });
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success("Pedido de saque efetuado com sucesso!");
      setAmount("");
      refetchWithdrawals();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingWithdrawalsAmount = withdrawals
    ?.filter(w => w.status === "pending")
    .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  const availableBalance = Math.max(0, (wallet?.balance || 0) - pendingWithdrawalsAmount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minha Carteira</h1>
        <p className="text-muted-foreground">Faça a gestão dos seus ganhos (90% das suas vendas).</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-primary-foreground/80 font-medium">Saldo Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <Wallet className="h-6 w-6" />
              </div>
              <div>
                <div className="text-3xl font-bold">{availableBalance.toFixed(2)} MT</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground">Total Ganho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-xl">
                <ArrowUpRight className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{wallet?.total_earned?.toFixed(2) || "0.00"} MT</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground">Em Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-xl">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingWithdrawalsAmount.toFixed(2)} MT</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Solicitar Saque</CardTitle>
            <CardDescription>O dinheiro será enviado para a conta associada ao seu perfil M-Pesa/e-Mola.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Valor (MT)</label>
                <input 
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 5000"
                  max={availableBalance}
                  className="w-full p-3 rounded-xl border bg-background"
                />
              </div>
              <button 
                onClick={() => withdrawMutation.mutate()}
                disabled={withdrawMutation.isPending || !amount || Number(amount) > availableBalance || Number(amount) <= 0}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50"
              >
                {withdrawMutation.isPending ? "Processando..." : "Levantar Dinheiro"}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Saques</CardTitle>
          </CardHeader>
          <CardContent>
            {withdrawals?.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum saque solicitado ainda.</p>
            ) : (
              <div className="space-y-4">
                {withdrawals?.slice(0, 5).map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between p-3 border rounded-xl">
                    <div className="flex items-center gap-3">
                      {w.status === "completed" && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {w.status === "pending" && <Clock className="h-5 w-5 text-orange-500" />}
                      {w.status === "rejected" && <XCircle className="h-5 w-5 text-red-500" />}
                      <div>
                        <p className="font-medium">{w.amount} MT</p>
                        <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase">
                      {w.status === "completed" ? "Concluído" : w.status === "pending" ? "Pendente" : "Rejeitado"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
