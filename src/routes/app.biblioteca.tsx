import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BookOpen, Download, FileText, Loader2, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getEbookSignedUrl } from "@/actions/ebooks";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/app/biblioteca")({
  component: BibliotecaPage,
});

function BibliotecaPage() {
  const { user } = useAuth();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { data: purchases, isLoading } = useQuery({
    queryKey: ["my-ebooks", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ebook_purchases")
        .select(`
          id, created_at,
          ebook:ebooks(id, title, slug, cover_url, format, author:profiles!ebooks_author_id_fkey(full_name))
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleDownload = async (ebookId: string) => {
    setDownloadingId(ebookId);
    try {
      const res = await getEbookSignedUrl({ data: { ebookId } });
      if (res.signedUrl) {
        const a = document.createElement("a");
        a.href = res.signedUrl;
        a.target = "_blank";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Download iniciado!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao gerar link de download.");
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 bg-gradient-to-br from-primary/10 via-background to-background p-8 rounded-2xl border border-primary/10">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
          <Library className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">A Minha Biblioteca</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Aqui tens acesso a todos os E-books e materiais que compraste. Descarrega sempre que precisares.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : purchases && purchases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {purchases.map((purchase) => {
            const ebook = Array.isArray(purchase.ebook) ? purchase.ebook[0] : purchase.ebook;
            if (!ebook) return null;
            
            // Note: Since ebook relation is one-to-one, PostgREST might return an array or object. Let's cast it safely.
            const eb = ebook as any;
            const authorName = eb.author?.full_name || "Imersão Completa";
            
            return (
              <div key={purchase.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="w-24 shrink-0 rounded-lg overflow-hidden bg-muted aspect-[3/4] relative shadow-sm border border-border/50">
                    {eb.cover_url ? (
                      <img src={eb.cover_url} alt={eb.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full w-full">
                        <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground mb-1">
                      <FileText className="h-3 w-3" /> {eb.format || "PDF"}
                    </div>
                    <Link to="/app/ebook/$slug" params={{ slug: eb.slug }} className="text-lg font-bold hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {eb.title}
                    </Link>
                    <div className="text-sm text-muted-foreground mt-1">Por {authorName}</div>
                    
                    <div className="mt-auto pt-4">
                      <Button 
                        onClick={() => handleDownload(eb.id)}
                        disabled={downloadingId === eb.id}
                        className="w-full h-10 gap-2 shadow-sm"
                      >
                        {downloadingId === eb.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        Descarregar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center px-4 bg-muted/30">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Library className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Biblioteca Vazia</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Ainda não compraste nenhum e-book. Vai até à nossa loja e descobre os melhores materiais para o teu desenvolvimento.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/ebooks">Visitar Loja de E-books</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
