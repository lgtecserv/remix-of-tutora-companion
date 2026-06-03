import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Download, Maximize2, Minimize2, Plus, Type, Palette, Layout, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, BackgroundVariant, Panel, Node, Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { v4 as uuidv4 } from "uuid";

export const Route = createFileRoute("/admin/mapas-mentais/$id")({
  component: MapaMentalEditor,
});

const colorPresets = [
  "#f43f5e", // rose
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#64748b", // slate
  "#ffffff", // white
  "#1e293b", // dark
];

function MapaMentalEditor() {
  const { id } = Route.useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [title, setTitle] = useState("");
  const [presentationMode, setPresentationMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);

  const { data: mapa, isLoading } = useQuery({
    queryKey: ["mind-map", id],
    queryFn: async () => {
      const { data, error } = await (supabase.from("mind_maps" as any).select("*").eq("id", id).single() as any);
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (mapa) {
      setTitle(mapa.title || "Sem Título");
      if (mapa.nodes) setNodes(mapa.nodes as Node[]);
      if (mapa.edges) setEdges(mapa.edges as Edge[]);
    }
  }, [mapa, setNodes, setEdges]);

  const onConnect = useCallback((params: any) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)), [setEdges]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase
        .from("mind_maps" as any)
        .update({
          title,
          nodes: nodes as any,
          edges: edges as any,
          updated_at: new Date().toISOString()
        })
        .eq("id", id) as any);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Mapa guardado com sucesso!"),
    onError: () => toast.error("Erro ao guardar mapa"),
  });

  const exportPDF = async () => {
    if (!flowRef.current) return;
    toast.info("A gerar PDF...");
    try {
      // Ocultar Controlos temporariamente
      const controls = flowRef.current.querySelectorAll('.react-flow__controls, .react-flow__panel');
      controls.forEach((c: any) => c.style.display = 'none');

      const canvas = await html2canvas(flowRef.current, {
        scale: 2,
        backgroundColor: "#f8fafc",
      });

      controls.forEach((c: any) => c.style.display = '');

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
      toast.success("PDF gerado com sucesso!");
    } catch (e) {
      toast.error("Erro ao gerar PDF");
      console.error(e);
    }
  };

  const addNode = () => {
    const newNode: Node = {
      id: uuidv4(),
      type: "default",
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label: "Nova Ideia" },
      style: {
        background: "#ffffff",
        color: "#1e293b",
        border: "2px solid #e2e8f0",
        borderRadius: "8px",
        padding: "10px 20px",
        fontWeight: "bold"
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateSelectedNodeColor = (color: string) => {
    if (!selectedNodeId) return;
    const isDark = ["#1e293b", "#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"].includes(color);
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            style: {
              ...n.style,
              background: color,
              color: isDark ? "#ffffff" : "#1e293b",
              border: `2px solid ${color}`,
            },
          };
        }
        return n;
      })
    );
  };

  const updateSelectedNodeText = (text: string) => {
    if (!selectedNodeId) return;
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id === selectedNodeId) {
          return { ...n, data: { ...n.data, label: text } };
        }
        return n;
      })
    );
  };

  const deleteSelectedNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter(n => n.id !== selectedNodeId));
    setEdges((eds) => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
    setSelectedNodeId(null);
  };

  if (isLoading) return <div className="p-8">A carregar mapa...</div>;

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className={`flex flex-col ${presentationMode ? 'fixed inset-0 z-50 bg-background' : 'h-[calc(100vh-64px)]'}`}>
      {/* Header Toolbar */}
      {!presentationMode && (
        <div className="flex flex-wrap items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link to={"/admin/mapas-mentais" as any}>
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="text-lg font-bold bg-transparent border-none focus-visible:ring-1 w-64 px-0"
              placeholder="Título do Mapa"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" /> Guardar
            </Button>
            <Button variant="outline" onClick={exportPDF}>
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
            <Button variant="default" onClick={() => setPresentationMode(true)}>
              <Maximize2 className="h-4 w-4 mr-2" /> Apresentar
            </Button>
          </div>
        </div>
      )}

      {presentationMode && (
        <Button 
          variant="outline" 
          size="icon" 
          className="absolute top-4 right-4 z-[60] bg-background/80 backdrop-blur"
          onClick={() => setPresentationMode(false)}
        >
          <Minimize2 className="h-4 w-4" />
        </Button>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* React Flow Canvas */}
        <div className="flex-1 relative" ref={flowRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            fitView
            attributionPosition="bottom-right"
          >
            <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#cbd5e1" />
            <Controls />
            {!presentationMode && <MiniMap zoomable pannable />}
            
            {!presentationMode && (
              <Panel position="top-left" className="bg-card border border-border rounded-lg shadow-sm p-2 flex gap-2">
                <Button variant="secondary" size="sm" onClick={addNode}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Bloco
                </Button>
              </Panel>
            )}
          </ReactFlow>
        </div>

        {/* Right Sidebar (Properties) */}
        {!presentationMode && selectedNode && (
          <div className="w-80 border-l border-border bg-card p-6 overflow-y-auto">
            <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <Layout className="h-5 w-5" /> Propriedades
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Type className="h-4 w-4" /> Texto do Bloco
                </label>
                <Input 
                  value={selectedNode.data.label as string} 
                  onChange={(e) => updateSelectedNodeText(e.target.value)} 
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4" /> Cor
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorPresets.map(color => (
                    <button
                      key={color}
                      onClick={() => updateSelectedNodeColor(color)}
                      className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${selectedNode.style?.background === color ? 'border-primary ring-2 ring-primary ring-offset-background' : 'border-border/50'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <Button variant="destructive" className="w-full" onClick={deleteSelectedNode}>
                  <Trash2 className="h-4 w-4 mr-2" /> Apagar Bloco
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
