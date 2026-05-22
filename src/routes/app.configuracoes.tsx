import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app/configuracoes")({ component: SettingsPage });

function SettingsPage() {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  async function changePassword() {
    if (pw.length < 6) return toast.error("Senha deve ter pelo menos 6 caracteres");
    if (pw !== pw2) return toast.error("Senhas não coincidem");
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) toast.error(error.message); else { toast.success("Senha atualizada"); setPw(""); setPw2(""); }
  }
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-secondary">Configurações</h1>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <h2 className="font-semibold text-secondary">Alterar senha</h2>
        <div><Label>Nova senha</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div><Label>Confirmar nova senha</Label><Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        <Button onClick={changePassword}>Atualizar senha</Button>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-semibold text-secondary">Segurança</h2>
        <p className="mt-2 text-sm text-muted-foreground">Mantenha sua conta segura usando uma senha forte e única.</p>
      </div>
    </div>
  );
}