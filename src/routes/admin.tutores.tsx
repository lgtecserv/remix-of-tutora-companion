import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useState } from "react";
import { CheckCircle, XCircle, Eye, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/admin/tutores")({
  component: AdminTutors,
});

function AdminTutors() {
  const qc = useQueryClient();
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const { data: applications, isLoading } = useQuery({
    queryKey: ["admin-tutor-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tutor_applications")
        .select(`
          *,
          profiles(full_name, avatar_url, email)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { data: app, error: fetchErr } = await supabase
        .from("tutor_applications")
        .select("user_id")
        .eq("id", appId)
        .single();
      if (fetchErr) throw fetchErr;

      // Update application status
      const { error: appErr } = await supabase
        .from("tutor_applications")
        .update({ status: "paid" })
        .eq("id", appId);
      if (appErr) throw appErr;

      // Update profile
      const { error: profErr } = await supabase
        .from("profiles")
        .update({ is_tutor: true })
        .eq("id", app.user_id);
      if (profErr) throw profErr;

      // Create wallet if not exists
      const { error: walletErr } = await supabase
        .from("tutor_wallet")
        .insert({ tutor_id: app.user_id })
        .select()
        .single();
      // Ignore conflict error if wallet already exists
      if (walletErr && walletErr.code !== '23505') throw walletErr;

      return true;
    },
    onSuccess: () => {
      toast.success("Tutor aprovado com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-tutor-applications"] });
      setSelectedApp(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (appId: string) => {
      const { error } = await supabase
        .from("tutor_applications")
        .update({ status: "rejected" })
        .eq("id", appId);
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success("Candidatura rejeitada.");
      qc.invalidateQueries({ queryKey: ["admin-tutor-applications"] });
      setSelectedApp(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Aplicações de Tutores</h1>

      {isLoading ? (
        <p className="text-muted-foreground">A carregar...</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Utilizador</th>
                <th className="px-4 py-3">Método Pag.</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(applications ?? []).map((app: any) => (
                <tr key={app.id} className="border-t border-border">
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(app.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {app.profiles?.full_name || app.profiles?.email || app.user_id}
                  </td>
                  <td className="px-4 py-3 capitalize">{app.payment_method || "—"}</td>
                  <td className="px-4 py-3">
                    {app.status === "paid" && <span className="text-green-500 font-semibold">Pago</span>}
                    {app.status === "pending" && <span className="text-orange-500 font-semibold">Pendente</span>}
                    {app.status === "rejected" && <span className="text-red-500 font-semibold">Rejeitado</span>}
                  </td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedApp(app)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Rever
                    </Button>
                  </td>
                </tr>
              ))}
              {applications?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhuma candidatura encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedApp && (
        <Dialog open onOpenChange={(open) => !open && setSelectedApp(null)}>
          <DialogContent aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle>Rever Candidatura de Tutor</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-muted-foreground block">Nome</span>
                  {selectedApp.profiles?.full_name || "—"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block">Email</span>
                  {selectedApp.profiles?.email || "—"}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block">Status</span>
                  {selectedApp.status}
                </div>
                <div>
                  <span className="font-semibold text-muted-foreground block">Método</span>
                  {selectedApp.payment_method}
                </div>
              </div>

              {selectedApp.payment_method === "manual" && selectedApp.receipt_url && (
                <div className="border rounded-xl p-4 bg-muted/30">
                  <span className="font-semibold text-muted-foreground block mb-2">Comprovativo:</span>
                  <a href={selectedApp.receipt_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    Ver Comprovativo Externo <ExternalLink className="h-4 w-4" />
                  </a>
                  {selectedApp.receipt_url.match(/\.(jpeg|jpg|gif|png)$/i) && (
                    <img src={selectedApp.receipt_url} alt="Comprovativo" className="mt-4 max-w-full rounded-lg border max-h-64 object-contain" />
                  )}
                </div>
              )}

              {selectedApp.status === "pending" && (
                <div className="flex gap-4 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="flex-1 text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={() => rejectMutation.mutate(selectedApp.id)}
                    disabled={rejectMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button 
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => approveMutation.mutate(selectedApp.id)}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar Pagamento
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
