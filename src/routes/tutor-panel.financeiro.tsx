import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, ArrowUpRight, Clock, CheckCircle, XCircle, Info, Settings } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/tutor-panel/financeiro")({
  component: TutorWallet,
});

function TutorWallet() {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  
  // Settings State
  const [mpesaNumber, setMpesaNumber] = useState("");
  const [emolaNumber, setEmolaNumber] = useState("");
  
  // Withdrawal State
  const [withdrawalMethod, setWithdrawalMethod] = useState("");

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ["tutor-wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("tutor_wallet")
        .select("*")
        .eq("tutor_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data || { balance: 0, total_earned: 0, mpesa_number: "", emola_number: "" };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (wallet) {
      if (wallet.mpesa_number) setMpesaNumber(wallet.mpesa_number);
      if (wallet.emola_number) setEmolaNumber(wallet.emola_number);
      
      // Auto-select a method if one is available
      if (wallet.mpesa_number) setWithdrawalMethod("M-Pesa");
      else if (wallet.emola_number) setWithdrawalMethod("e-Mola");
    }
  }, [wallet]);

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

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      if (!mpesaNumber && !emolaNumber) throw new Error("Preencha pelo menos um número de pagamento");

      const { error } = await supabase
        .from("tutor_wallet")
        .upsert({
          tutor_id: user.id,
          mpesa_number: mpesaNumber || null,
          emola_number: emolaNumber || null
        }, { onConflict: 'tutor_id' });
        
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Contas guardadas com sucesso!");
      refetchWallet();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const val = parseFloat(amount);
      if (isNaN(val) || val < 500) throw new Error("Valor mínimo de saque é 500 MT");
      if (val > (wallet?.balance || 0)) throw new Error("Saldo insuficiente");
      if (!withdrawalMethod) throw new Error("Selecione um método de saque");
      
      const targetNumber = withdrawalMethod === "M-Pesa" ? wallet?.mpesa_number : wallet?.emola_number;
      if (!targetNumber) throw new Error(`Não tem nenhum número de ${withdrawalMethod} configurado na sua conta.`);
      
      const { error } = await supabase
        .from("tutor_withdrawals")
        .insert({ 
          tutor_id: user.id, 
          amount: val, 
          status: "pending",
          payment_method: withdrawalMethod,
          payment_number: targetNumber
        });
        
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success("Pedido de saque efetuado. Aguarde até 24h.");
      setAmount("");
      refetchWithdrawals();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const pendingWithdrawalsAmount = withdrawals
    ?.filter(w => w.status === "pending")
    .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  const availableBalance = Math.max(0, (wallet?.balance || 0) - pendingWithdrawalsAmount);
  const hasAnyMethodConfigured = !!wallet?.mpesa_number || !!wallet?.emola_number;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Minha Carteira</h1>
        <p className="text-muted-foreground mt-1">Faça a gestão dos seus ganhos (85% das suas vendas).</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-primary/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-32 h-32 transform translate-x-8 -translate-y-8" />
          </div>
          <CardHeader>
            <CardTitle className="text-primary-foreground/90 font-medium">Saldo Disponível</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold">{availableBalance.toLocaleString('pt-PT', {minimumFractionDigits: 2})} MT</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-medium text-muted-foreground">Total Ganho (85%)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 text-green-600 rounded-xl">
                <ArrowUpRight className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{(wallet?.total_earned || 0).toLocaleString('pt-PT')} MT</div>
                <p className="text-xs text-muted-foreground">Historicamente na plataforma</p>
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
              <div className="p-3 bg-orange-500/10 text-orange-600 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <div className="text-2xl font-bold">{pendingWithdrawalsAmount.toLocaleString('pt-PT')} MT</div>
                <p className="text-xs text-muted-foreground">Saques aguardando o Admin</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          {/* Configuração de Contas */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Contas de Pagamento
              </CardTitle>
              <CardDescription>Onde devemos enviar o seu dinheiro?</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Número M-Pesa</label>
                <Input 
                  placeholder="Ex: 841234567" 
                  value={mpesaNumber} 
                  onChange={(e) => setMpesaNumber(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Número e-Mola</label>
                <Input 
                  placeholder="Ex: 861234567" 
                  value={emolaNumber} 
                  onChange={(e) => setEmolaNumber(e.target.value)} 
                />
              </div>

              <Button 
                className="w-full mt-2" 
                onClick={() => saveSettingsMutation.mutate()} 
                disabled={saveSettingsMutation.isPending}
              >
                {saveSettingsMutation.isPending ? "A guardar..." : "Guardar Dados"}
              </Button>
            </CardContent>
          </Card>

          {/* Pedir Saque */}
          <Card>
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-lg">Solicitar Saque</CardTitle>
              <CardDescription>Valor mínimo de 500 MT. Prazo até 24h.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {!hasAnyMethodConfigured ? (
                <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground border rounded-xl bg-muted/20">
                  <Info className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-sm">Configure pelo menos um número acima primeiro.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Método a Receber</label>
                    <Select value={withdrawalMethod} onValueChange={setWithdrawalMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha..." />
                      </SelectTrigger>
                      <SelectContent>
                        {wallet?.mpesa_number && <SelectItem value="M-Pesa">M-Pesa ({wallet.mpesa_number})</SelectItem>}
                        {wallet?.emola_number && <SelectItem value="e-Mola">e-Mola ({wallet.emola_number})</SelectItem>}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Valor a Levantar (MT)</label>
                    <Input 
                      placeholder="Ex: 500" 
                      type="number"
                      min="500"
                      max={availableBalance}
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                    />
                  </div>
                  
                  <Button 
                    className="w-full mt-2" 
                    onClick={() => withdrawMutation.mutate()} 
                    disabled={withdrawMutation.isPending || !amount || parseFloat(amount) < 500}
                  >
                    Levantar Dinheiro
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="h-full border-none shadow-sm bg-card/50">
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Saques</CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawals?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground border-2 border-dashed rounded-2xl">
                  <Wallet className="w-12 h-12 mb-4 opacity-20" />
                  <p>Nenhum saque solicitado ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {withdrawals?.map(w => (
                    <div key={w.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${w.status === 'completed' ? 'bg-green-500/10 text-green-500' : w.status === 'rejected' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                          {w.status === 'completed' ? <CheckCircle className="w-5 h-5" /> : w.status === 'rejected' ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{Number(w.amount).toLocaleString('pt-PT')} MT</p>
                          <p className="text-xs text-muted-foreground flex gap-2">
                            <span>{new Date(w.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="uppercase text-xs">{w.payment_method || "Método Antigo"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${w.status === 'completed' ? 'bg-green-500/10 text-green-600' : w.status === 'rejected' ? 'bg-red-500/10 text-red-600' : 'bg-orange-500/10 text-orange-600'}`}>
                          {w.status === 'completed' ? 'Recebido' : w.status === 'rejected' ? 'Rejeitado' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
