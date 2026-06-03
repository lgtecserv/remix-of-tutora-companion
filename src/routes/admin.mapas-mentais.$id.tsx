import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Download, Maximize2, Minimize2, Plus, Type, Palette, Layout, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, BackgroundVariant, Panel, Node, Edge, Handle, Position, useReactFlow } from "@xyflow/react";
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

function CustomNode({ id, data, isConnectable, selected }: any) {
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();

  const addChild = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nodes = getNodes();
    const parentNode = nodes.find((n) => n.id === id);
    if (!parentNode) return;

    // Se o nó estiver colapsado, expandimos antes de adicionar o filho
    if (data.isExpanded === false) {
      toggleCollapse(e, true);
    }

    const newId = uuidv4();
    const newNode: Node = {
      id: newId,
      type: "custom",
      position: { 
        x: parentNode.position.x + 280, 
        y: parentNode.position.y + (Math.random() * 100 - 50) 
      },
      data: { 
        label: "Nova Ideia",
        bgColor: parentNode.data.bgColor || "#ffffff",
        textColor: parentNode.data.textColor || "#1e293b",
      }
    };

    const newEdge: Edge = {
      id: uuidv4(),
      source: id,
      target: newId,
      animated: true,
      style: { stroke: "#64748b", strokeWidth: 2 }
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds: any) => [...eds, newEdge]);
  };

  const hasChildren = getEdges().some((e: Edge) => e.source === id);
  const isExpanded = data.isExpanded !== false; // true por omissão

  const toggleCollapse = (e: React.MouseEvent, forceExpand: boolean = false) => {
    e.stopPropagation();
    const allNodes = getNodes();
    const allEdges = getEdges();
    
    const newExpandedState = forceExpand ? true : !isExpanded;
    
    let updatedNodes = allNodes.map(n => 
      n.id === id ? { ...n, data: { ...n.data, isExpanded: newExpandedState } } : n
    );

    const parentToChildren: Record<string, string[]> = {};
    allEdges.forEach((edge: Edge) => {
      if (!parentToChildren[edge.source]) parentToChildren[edge.source] = [];
      parentToChildren[edge.source].push(edge.target);
    });

    const applyHidden = (nodeId: string, hide: boolean) => {
      const children = parentToChildren[nodeId] || [];
      children.forEach(childId => {
        const childNode = updatedNodes.find(n => n.id === childId);
        if (childNode) {
          childNode.hidden = hide;
          const childExpanded = childNode.data.isExpanded !== false;
          applyHidden(childId, hide || !childExpanded);
        }
      });
    };

    applyHidden(id, !newExpandedState);

    setNodes([...updatedNodes]);
    setEdges(allEdges.map((edge: any) => {
      const targetNode = updatedNodes.find(n => n.id === edge.target);
      return { ...edge, hidden: targetNode ? targetNode.hidden : false };
    }));
  };

  return (
    <div 
      className={`group relative px-4 py-3 rounded-lg border-2 min-w-[140px] max-w-[280px] shadow-sm transition-shadow ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
      style={{ backgroundColor: data.bgColor || "#ffffff", borderColor: data.bgColor || "#e2e8f0", color: data.textColor || "#1e293b" }}
    >
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} className="w-2 h-4 rounded-sm bg-muted-foreground border-none -ml-1" />
      <div className="text-sm font-semibold text-center whitespace-pre-wrap break-words leading-tight">
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} className="w-2 h-4 rounded-sm bg-muted-foreground border-none -mr-1" />
      
      {hasChildren && (
        <button
          onClick={(e) => toggleCollapse(e)}
          className="absolute -right-3 top-1 bg-secondary text-secondary-foreground w-5 h-5 rounded-full flex items-center justify-center text-xs shadow-md border border-border hover:bg-secondary/80 transition-colors z-20"
          title={isExpanded ? "Recolher" : "Expandir"}
        >
          {isExpanded ? "-" : "+"}
        </button>
      )}

      <button 
        onClick={addChild}
        className="absolute -right-3 bottom-1 bg-primary text-primary-foreground w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity text-xs shadow-md border border-border hover:scale-110 z-20"
        title="Adicionar ramificação"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function MapaMentalEditor() {
  const { id } = Route.useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [title, setTitle] = useState("");
  const [presentationMode, setPresentationMode] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  
  // Custom node types memorizados
  const nodeTypes = useMemo(() => ({ custom: CustomNode }), []);

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
      // Migração de dados antigos para o novo formato
      if (mapa.nodes) {
        const migratedNodes = (mapa.nodes as any[]).map(n => ({
          ...n,
          type: "custom",
          data: {
            ...n.data,
            bgColor: n.data.bgColor || n.style?.background || "#ffffff",
            textColor: n.data.textColor || n.style?.color || "#1e293b",
          },
          style: undefined // Remove inline styles antigos
        }));
        setNodes(migratedNodes as Node[]);
      }
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
      type: "custom",
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { 
        label: "Nova Ideia",
        bgColor: "#ffffff",
        textColor: "#1e293b",
      }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const updateSelectedNodeColor = (color: string) => {
    if (!selectedNodeId) return;
    const isDark = ["#1e293b", "#f43f5e", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"].includes(color);
    setNodes((nds: any) =>
      nds.map((n: any) => {
        if (n.id === selectedNodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              bgColor: color,
              textColor: isDark ? "#ffffff" : "#1e293b",
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
        {/* CSS para corrigir botões de controle brancos */}
        <style>{`
          .react-flow__controls-button {
            background-color: #1e293b !important;
            fill: #f8fafc !important;
            border-bottom: 1px solid #334155 !important;
          }
          .react-flow__controls-button:hover {
            background-color: #334155 !important;
          }
        `}</style>
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
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              className="bg-muted/30"
            >
              <Background variant={BackgroundVariant.Dots} gap={24} size={2} color="#64748b" />
              <Controls className="bg-card border-border fill-foreground" />
              {!presentationMode && <MiniMap zoomable pannable style={{ backgroundColor: '#1e293b' }} nodeColor={(n: any) => n.data?.bgColor || '#ffffff'} maskColor="#0f172a99" />}
              
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
                      className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-offset-2 ${selectedNode.data?.bgColor === color ? 'border-primary ring-2 ring-primary ring-offset-background' : 'border-border/50'}`}
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
