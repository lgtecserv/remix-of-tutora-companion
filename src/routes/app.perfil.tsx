import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/app/perfil")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const [name, setName] = useState(""); const [avatar, setAvatar] = useState(""); const [bio, setBio] = useState("");
  useEffect(() => { if (data) { setName(data.full_name ?? ""); setAvatar(data.avatar_url ?? ""); setBio(data.bio ?? ""); } }, [data]);

  async function save() {
    const { error } = await supabase.from("profiles").upsert({ id: user!.id, full_name: name, avatar_url: avatar, bio });
    if (error) toast.error(error.message); else { toast.success("Perfil atualizado"); qc.invalidateQueries({ queryKey: ["profile"] }); }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold text-secondary">Perfil</h1>
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          {avatar ? <img src={avatar} alt="" className="h-20 w-20 rounded-full object-cover" /> : <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-2xl text-muted-foreground">{(name || user?.email || "?")[0]?.toUpperCase()}</div>}
          <div><div className="font-semibold text-secondary">{user?.email}</div><div className="text-xs text-muted-foreground">Email não pode ser alterado aqui</div></div>
        </div>
        <div><Label>Nome completo</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>URL da foto</Label><Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." /></div>
        <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} /></div>
        <Button onClick={save}>Salvar alterações</Button>
      </div>
    </div>
  );
}