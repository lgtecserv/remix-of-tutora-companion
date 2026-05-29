import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/actions/checkout";
import { uploadPaymentReceipt } from "@/actions/uploadReceipt";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Smartphone, Building2, CreditCard, Upload, CheckCircle2, Copy, ArrowLeft } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  price: number;
  userId: string;
  onSuccess?: () => void;
}

type Step = "choose-method" | "processing" | "manual-instructions" | "upload-receipt" | "done";

const PAYMENT_METHODS = [
  { id: "paysuite" as const, label: "Pagamento Automático", icon: CreditCard, color: "text-emerald-500", description: "Pagar via M-Pesa, e-Mola ou Cartão pelo PaySuite. Acesso imediato." },
  { id: "manual" as const, label: "Pagamento Manual", icon: Upload, color: "text-blue-500", description: "Transferência ou depósito direto. Requer envio de comprovativo." },
];

export function PaymentDialog({ open, onOpenChange, courseId, courseTitle, price, userId, onSuccess }: PaymentDialogProps) {
  const qc = useQueryClient();
  const [step, setStep] = useState<Step>("choose-method");
  const [selectedMethod, setSelectedMethod] = useState<"paysuite" | "manual" | "mpesa" | "emola" | "transferencia" | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const resetState = () => {
    setStep("choose-method");
    setSelectedMethod(null);
    setPaymentRef(null);
    setLoading(false);
    setReceiptFile(null);
    setUploading(false);
  };

  const handleOpenChange = (val: boolean) => {
    if (!val) resetState();
    onOpenChange(val);
  };

  const handleSelectMethod = async (methodId: "paysuite" | "manual") => {
    setSelectedMethod(methodId);
    setStep("processing");
    setLoading(true);

    try {
      // "paysuite" means we want the gateway. "manual" defaults to "transferencia" in the backend.
      const apiMethod = methodId === "paysuite" ? "credit_card" : "transferencia";
      const result = await createCheckoutSession({ data: { courseId, method: apiMethod } });

      if (methodId === "paysuite" && result.checkoutUrl) {
        // Redirect to PaySuite
        window.location.href = result.checkoutUrl;
        return;
      }

      // If manual or if PaySuite fell back to manual
      if (result.fallbackReason) {
        toast.error("PaySuite indisponível: " + result.fallbackReason);
      }
      setPaymentRef(result.reference);
      setStep("manual-instructions");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar o pagamento.");
      setStep("choose-method");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!receiptFile || !paymentRef) return;

    try {
      setUploading(true);
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${paymentRef}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, receiptFile, { upsert: true });

      if (uploadError) throw new Error("Erro ao fazer upload do ficheiro.");

      const { data: publicUrlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      await uploadPaymentReceipt({ data: { paymentId: paymentRef, receiptUrl: publicUrlData.publicUrl } });

      setStep("done");
      qc.invalidateQueries({ queryKey: ["course-overview"] });
      qc.invalidateQueries({ queryKey: ["my-enrolls"] });
      qc.invalidateQueries({ queryKey: ["my-courses"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao anexar comprovativo.");
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

  const formattedPrice = Number(price).toLocaleString("pt-PT");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md" aria-describedby="payment-dialog-desc">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg">
            {step === "choose-method" && "Escolha o método de pagamento"}
            {step === "processing" && "A processar..."}
            {step === "manual-instructions" && "Instruções de Pagamento"}
            {step === "upload-receipt" && "Enviar Comprovativo"}
            {step === "done" && "Comprovativo Enviado!"}
          </DialogTitle>
          <DialogDescription id="payment-dialog-desc">
            {step === "choose-method" && `${courseTitle} — ${formattedPrice} MT`}
            {step === "manual-instructions" && "Siga as instruções abaixo para completar o pagamento"}
            {step === "upload-receipt" && "Anexe a captura de ecrã ou foto do comprovativo"}
            {step === "done" && "O administrador irá rever o seu pagamento em breve"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {/* STEP 1: Choose method */}
          {step === "choose-method" && (
            <div className="space-y-3">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectMethod(m.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-all text-left group"
                >
                  <div className={`h-12 w-12 rounded-xl bg-muted flex items-center justify-center ${m.color} group-hover:scale-110 transition-transform`}>
                    <m.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground">{m.label}</div>
                    <div className="text-xs text-muted-foreground">{m.description}</div>
                  </div>
                  <div className="text-sm font-bold text-primary">{formattedPrice} MT</div>
                </button>
              ))}
            </div>
          )}

          {/* STEP 2: Processing */}
          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground text-sm">A criar o seu pedido de pagamento...</p>
            </div>
          )}

          {/* STEP 3: Manual instructions */}
          {step === "manual-instructions" && selectedMethod && (
            <div className="space-y-5">
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
                  <span className="font-bold text-lg text-primary">{formattedPrice} MT</span>
                </div>
              </div>

              {paymentRef && (
                <div className="rounded-xl bg-muted/50 border border-border p-3 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-muted-foreground">Referência do pagamento</div>
                    <div className="font-mono text-xs text-foreground break-all">{paymentRef.slice(0, 18)}...</div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={copyRef} className="shrink-0">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  <strong>Importante:</strong> Após efetuar o pagamento, envie o comprovativo (screenshot da SMS do M-Pesa, talão do banco, etc.) para que possamos liberar o seu acesso rapidamente.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep("choose-method")}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button className="flex-1" onClick={() => setStep("upload-receipt")}>
                  <Upload className="h-4 w-4 mr-2" /> Enviar Comprovativo
                </Button>
              </div>
            </div>
          )}

          {/* STEP 4: Upload receipt */}
          {step === "upload-receipt" && (
            <div className="space-y-4">
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
                <Button variant="outline" className="flex-1" onClick={() => setStep("manual-instructions")}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUploadReceipt}
                  disabled={!receiptFile || uploading}
                >
                  {uploading ? "A enviar..." : "Enviar Comprovativo"}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 5: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="h-16 w-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground text-lg">Comprovativo Recebido!</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  O administrador irá rever o seu pagamento e liberar o acesso ao curso o mais rápido possível.
                </p>
              </div>
              <Button className="mt-2" onClick={() => handleOpenChange(false)}>
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
