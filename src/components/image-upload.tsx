import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  bucket: "course-covers" | "blog-covers" | "blog-images";
  value: string;
  onChange: (url: string) => void;
  label?: string;
  aspect?: string; // tailwind aspect class
};

export function ImageUpload({ bucket, value, onChange, label = "Capa", aspect = "aspect-video" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"upload" | "url">("upload");

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) return toast.error("Máx. 5 MB");
    setBusy(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", bucket);
    formData.append("path", path);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      
      if (!res.ok || json.error) {
        toast.error(json.error || "Erro no upload");
        setBusy(false);
        return;
      }

      onChange(json.publicUrl);
    } catch (err: any) {
      toast.error(err.message || "Erro de conexão");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex gap-1 text-xs">
          <button type="button" onClick={() => setMode("upload")} className={`rounded px-2 py-1 ${mode === "upload" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Upload</button>
          <button type="button" onClick={() => setMode("url")} className={`rounded px-2 py-1 ${mode === "url" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>URL</button>
        </div>
      </div>
      {value && (
        <div className={`relative ${aspect} overflow-hidden rounded-xl border border-border bg-muted`}>
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={() => onChange("")} className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"><X className="h-4 w-4" /></button>
        </div>
      )}
      {mode === "upload" ? (
        <>
          <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Button type="button" variant="outline" onClick={() => ref.current?.click()} disabled={busy} className="w-full">
            <Upload className="h-4 w-4" /> {busy ? "A enviar..." : value ? "Trocar imagem" : "Enviar imagem"}
          </Button>
        </>
      ) : (
        <div className="flex gap-2">
          <LinkIcon className="mt-2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="https://..." value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
      )}
    </div>
  );
}