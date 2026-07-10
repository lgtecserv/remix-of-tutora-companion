import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { createTutorFeeSession, submitTutorReceipt } from "@/actions/tutor";
import logoImg from "@/assets/logo-imersao.png";

export const Route = createFileRoute("/tutor/pagamento")({
  component: TutorPaymentPage,
});

function TutorPaymentPage() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "emola" | "transferencia">("mpesa");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Check auth and application status
  const { data: appData, isLoading } = useQuery({
    queryKey: ["tutor-application-status"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate({ to: "/tutor/registro" });
        return null;
      }
      let { data } = await supabase
        .from("tutor_applications")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      // Se por algum motivo o insert no registo falhou (ex: delay do session), criamos agora
      if (!data) {
        const { data: newApp, error: insertErr } = await supabase
          .from("tutor_applications")
          .insert({ user_id: session.user.id, status: 'pending' })
          .select("*")
          .maybeSingle();
        
        if (!insertErr && newApp) {
          data = newApp;
        }
      }
      
      if (data?.status === "paid") {
        navigate({ to: "/tutor-panel" });
      }
      return data;
    },
  });

  const payMutation = useMutation({
    mutationFn: async () => {
      return await createTutorFeeSession({ data: { method: paymentMethod } });
    },
    onSuccess: (res) => {
      if (res.manualPayment) {
        setShowManual(true);
      } else if (res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao processar pagamento");
    }
  });

  const submitReceiptMutation = useMutation({
    mutationFn: async () => {
      if (!receiptUrl) throw new Error("Insira a URL do comprovativo");
      return await submitTutorReceipt({ data: { receiptUrl } });
    },
    onSuccess: () => {
      toast.success("Comprovativo enviado! Aguarde aprovação do admin.");
      window.location.reload();
    },
    onError: (err: any) => toast.error(err.message)
  });

  if (isLoading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  if (!appData) return null;

  if (appData.payment_method === "manual" && appData.status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-card border shadow-sm text-center">
          <h2 className="text-2xl font-bold text-primary mb-4">Em Análise</h2>
          <p className="text-muted-foreground mb-6">
            Recebemos o seu comprovativo de pagamento. O administrador irá verificar e aprovar a sua conta em breve.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md bg-card border rounded-3xl p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <img src={logoImg} alt="Logo" className="h-12 w-auto dark:invert" />
        </div>
        <h1 className="text-2xl font-bold text-center mb-2">Taxa de Adesão a Tutor</h1>
        <p className="text-center text-muted-foreground text-sm mb-8">
          Para ativar o seu painel de tutor e começar a criar cursos, efetue o pagamento da taxa única de <strong>500 MT</strong>.
        </p>

        {!showManual ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium">Método de Pagamento</label>
              <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setPaymentMethod("mpesa")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'mpesa' ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600' : 'hover:border-primary/50'}`}
                >
                  <span className="font-bold text-sm">M-Pesa</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod("emola")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'emola' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-600' : 'hover:border-primary/50'}`}
                >
                  <span className="font-bold text-sm">e-Mola</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod("transferencia")}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${paymentMethod === 'transferencia' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600' : 'hover:border-primary/50'}`}
                >
                  <span className="font-bold text-sm">Manual</span>
                </button>
              </div>
            </div>

            <button 
              onClick={() => payMutation.mutate()}
              disabled={payMutation.isPending}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {payMutation.isPending ? "A processar..." : "Pagar 500 MT"}
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Instruções para Transferência</h3>
              <p className="text-sm text-blue-700 dark:text-blue-400 mb-1">Transfira 500 MT para:</p>
              <p className="font-mono font-bold text-lg text-blue-900 dark:text-blue-100">84 123 4567</p>
              <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">Nome: Imersão Completa Lda</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Link do Comprovativo (Google Drive, Imgur, etc)</label>
              <input 
                type="url"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-3 rounded-xl border bg-background"
              />
              <p className="text-xs text-muted-foreground">Pode fazer upload da imagem em qualquer site e colar o link aqui.</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowManual(false)}
                className="flex-1 py-3 rounded-xl border bg-background hover:bg-muted font-medium"
              >
                Voltar
              </button>
              <button 
                onClick={() => submitReceiptMutation.mutate()}
                disabled={submitReceiptMutation.isPending || !receiptUrl}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50"
              >
                {submitReceiptMutation.isPending ? "A enviar..." : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
