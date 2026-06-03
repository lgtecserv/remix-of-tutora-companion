import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Network, ExternalLink, MoreVertical, Trash2, BookOpen } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/mapas-mentais/")({
  component: MapasMentaisIndex,
});

function MapasMentaisIndex() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: mapas, isLoading } = useQuery({
    queryKey: ["mind-maps"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("mind_maps" as any)
        .select(`
          *,
          courses ( title )
        `)
        .order("created_at", { ascending: false }) as any);
      
      if (error) throw error;
      return data as any[];
    },
  });

  async function handleCriarMapa() {
    const defaultNodes = [
      { id: "1", type: "input", position: { x: 250, y: 150 }, data: { label: "Nova Ideia" } }
    ];
    
    const { data, error } = await (supabase
      .from("mind_maps" as any)
      .insert({
        title: "Novo Mapa Mental",
        nodes: defaultNodes,
        edges: []
      })
      .select()
      .single() as any);

    if (error) {
      toast.error("Erro ao criar mapa mental");
      console.error(error);
      return;
    }

    toast.success("Mapa criado!");
    queryClient.invalidateQueries({ queryKey: ["mind-maps"] });
    navigate({ to: `/admin/mapas-mentais/${data.id}` as any });
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem a certeza que quer apagar este mapa mental? O ficheiro em PDF já gerado e enviado não será apagado.")) return;

    const { error } = await (supabase.from("mind_maps" as any).delete().eq("id", id) as any);
    if (error) {
      toast.error("Erro ao apagar");
    } else {
      toast.success("Apagado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["mind-maps"] });
    }
  }

  if (isLoading) return <div className="p-8 text-muted-foreground animate-pulse">A carregar mapas mentais...</div>;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Mapas Mentais</h1>
          <p className="text-muted-foreground mt-1">Organize as suas aulas e crie PDFs dinâmicos</p>
        </div>
        <Button onClick={handleCriarMapa} className="gap-2">
          <Plus className="h-4 w-4" /> Criar Mapa
        </Button>
      </div>

      {!mapas?.length ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-card rounded-lg border border-border border-dashed">
          <Network className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-medium text-foreground">Ainda não tem mapas mentais</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-sm">Use o mapa mental para estruturar as suas ideias ou dar aulas em ecrã inteiro.</p>
          <Button onClick={handleCriarMapa}>Começar agora</Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mapas.map((mapa) => (
            <Card key={mapa.id} className="flex flex-col">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl line-clamp-1">{mapa.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {new Date(mapa.updated_at).toLocaleDateString('pt-PT')}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDelete(mapa.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Apagar mapa
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                {mapa.courses && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <BookOpen className="h-3 w-3" />
                    {mapa.courses.title}
                  </div>
                )}
                {!mapa.courses && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground/70 text-xs font-medium">
                    Sem curso associado
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 border-t border-border/50 bg-muted/20">
                <Button asChild variant="ghost" className="w-full mt-4 justify-between text-primary hover:text-primary">
                  <Link to={`/admin/mapas-mentais/${mapa.id}` as any}>
                    Abrir Editor
                    <ExternalLink className="h-4 w-4 ml-2 opacity-50" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
