import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Link as LinkIcon, Film } from "lucide-react";
import { toast } from "sonner";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export function VideoUpload({ value, onChange, label = "Vídeo Aula" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");

  async function handleFile(file: File) {
    // Recomendar limite de 100MB para evitar estouro de limites do Supabase Free
    if (file.size > 100 * 1024 * 1024) {
      return toast.error("O arquivo é muito grande (Máx. 100 MB recomendado)");
    }
    
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "mp4";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    
    // Tentar fazer upload através da nossa API segura (ignora RLS via Service Role Key)
    let uploadBucket = "lesson-videos";
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", uploadBucket);
    formData.append("path", path);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        toast.error(`Falha no upload: ${json.error || "Erro desconhecido"}`);
        setBusy(false);
        return;
      }

      onChange(json.publicUrl);
      toast.success("Vídeo enviado com sucesso!");
    } catch (err: any) {
      toast.error(`Falha na conexão: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-secondary">{label}</span>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`rounded px-2 py-1 transition-colors ${
              mode === "upload"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Upload de Arquivo
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`rounded px-2 py-1 transition-colors ${
              mode === "url"
                ? "bg-primary text-primary-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Link Direto de Vídeo
          </button>
        </div>
      </div>

      {value && (
        <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-muted flex items-center justify-center">
          <video
            src={value}
            controls
            className="h-full w-full object-contain"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition-colors z-10"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {mode === "upload" ? (
        <>
          <input
            ref={ref}
            type="file"
            accept="video/mp4,video/webm,video/ogg,video/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="w-full flex gap-2 items-center justify-center h-11 border-dashed"
          >
            <Upload className="h-4 w-4 text-primary" />
            {busy ? "Enviando vídeo (isso pode demorar)..." : value ? "Trocar arquivo de vídeo" : "Selecionar arquivo de vídeo (MP4, WebM)"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Suporta formatos mp4, webm ou ogg de até 100MB.
          </p>
        </>
      ) : (
        <div className="flex gap-2 items-center">
          <Film className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <Input
            placeholder="https://exemplo.com/video.mp4"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1"
          />
        </div>
      )}
    </div>
  );
}
