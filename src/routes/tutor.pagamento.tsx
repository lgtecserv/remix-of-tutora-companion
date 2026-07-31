import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { createTutorFeeSession, submitTutorReceipt } from "@/actions/tutor";
import logoImg from "@/assets/logo-imersao.png";
import { Upload, CheckCircle2, Copy } from "lucide-react";

export const Route = createFileRoute("/tutor/pagamento")({
  component: TutorPaymentPage,
});

function TutorPaymentPage() {
  const navigate = useNavigate();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [step, setStep] = useState<"instructions" | "upload" | "done">("instructions");

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

  // Initialize payment reference on mount
  const initMutation = useMutation({
    mutationFn: async () => {
      return await createTutorFeeSession();
    },
    onSuccess: (res) => {
      setPaymentRef(res.reference);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao processar pagamento");
    }
  });

  const handleUploadReceipt = async () => {
    if (!receiptFile) return;

    try {
      setUploading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada. Faça login novamente.");

      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `tutor-fee-${Date.now()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, receiptFile, { upsert: true });

      if (uploadError) throw new Error("Erro ao fazer upload do ficheiro.");

      const { data: publicUrlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      await submitTutorReceipt({ data: { receiptUrl: publicUrlData.publicUrl } });

      setStep("done");
      toast.success("Comprovativo enviado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar comprovativo.");
    } finally {
      setUploading(false);
    }
  };

  const copyRef = () => {
    if (paymentRef) {
      navigator.clipboard.writeText(paymentRef);
      toast.success("Referência copiada!");
    }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  if (!appData) return null;

  // Show "Em Análise" if they already submitted a receipt
  if (appData.payment_method === "manual" && appData.status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md p-8 rounded-2xl bg-card border shadow-sm text-center">
          <div className="h-16 w-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-3">Em Análise</h2>
          {appData.submission_count > 1 && (
            <p className="text-sm font-semibold text-orange-500 mb-4">Esta é a sua {appData.submission_count}ª tentativa de pagamento.</p>
          )}
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

        {step === "instructions" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
            {/* Payment Details */}
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
              <h4 className="font-semibold text-foreground text-sm">Dados para pagamento:</h4>

              <div className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="font-semibold text-primary">Via M-Pesa Vodacom:</div>
                  <div className="flex justify-between pl-2 border-l-2 border-red-500">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-mono font-bold text-foreground">84 152 4822</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="font-semibold text-primary">Via e-Mola Movitel:</div>
                  <div className="flex justify-between pl-2 border-l-2 border-yellow-500">
                    <span className="text-muted-foreground">Número:</span>
                    <span className="font-mono font-bold text-foreground">86 982 4047</span>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="font-semibold text-primary">Transferência Bancária (BIM):</div>
                  <div className="flex justify-between pl-2 border-l-2 border-blue-500">
                    <span className="text-muted-foreground">NIB:</span>
                    <span className="font-mono font-bold text-foreground">000100000104900407657</span>
                  </div>
                  <div className="flex justify-between pl-2 border-l-2 border-blue-500">
                    <span className="text-muted-foreground">Titular:</span>
                    <span className="font-semibold text-foreground">INACIO ZACARIAS LANGA</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-primary/10">
                <span className="text-muted-foreground text-sm">Valor:</span>
                <span className="font-bold text-lg text-primary">500 MT</span>
              </div>
            </div>

            {/* Reference (generated on demand) */}
            {paymentRef && (
              <div className="rounded-xl bg-muted/50 border border-border p-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-muted-foreground">Referência do pagamento</div>
                  <div className="font-mono text-xs text-foreground break-all">{paymentRef.slice(0, 18)}...</div>
                </div>
                <button onClick={copyRef} className="shrink-0 p-2 rounded-lg hover:bg-muted transition-colors">
                  <Copy className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            )}

            {/* Important Notice */}
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                <strong>Importante:</strong> Após efetuar o pagamento, envie o comprovativo (screenshot da SMS do M-Pesa, talão do banco, etc.) para que possamos liberar o seu acesso rapidamente.
              </p>
            </div>

            <button
              onClick={() => {
                if (!paymentRef) {
                  initMutation.mutate();
                }
                setStep("upload");
              }}
              disabled={initMutation.isPending}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Upload className="h-5 w-5" />
              {initMutation.isPending ? "A processar..." : "Já paguei — Enviar Comprovativo"}
            </button>
          </div>
        )}

        {step === "upload" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4">
            <p className="text-sm text-muted-foreground">
              Anexe uma captura de ecrã do talão de transferência ou a SMS do M-Pesa/e-Mola comprovando o débito.
            </p>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-secondary-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setStep("instructions")}
                className="flex-1 py-3 rounded-xl border bg-background hover:bg-muted font-medium transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleUploadReceipt}
                disabled={!receiptFile || uploading}
                className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {uploading ? "A enviar..." : "Enviar Comprovativo"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center justify-center py-8 gap-4 text-center animate-in fade-in slide-in-from-bottom-4">
            <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">Comprovativo Recebido!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                O administrador irá rever o seu pagamento e liberar o acesso ao painel de tutor o mais rápido possível.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
