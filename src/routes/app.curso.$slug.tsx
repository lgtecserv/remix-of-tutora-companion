import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { createCheckoutSession } from "@/actions/checkout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Play, PlayCircle, Clock, BookOpen, GraduationCap, ChevronDown, CheckCircle2, Circle, Lock, ArrowLeft, Star, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { uploadPaymentReceipt } from "@/actions/uploadReceipt";
import { toast } from "sonner";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/curso/$slug")({ component: CourseOverview });

function CourseOverview() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["course-overview", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: course } = await supabase.from("courses").select("*, instructors(name, avatar_url, bio)").eq("slug", slug).maybeSingle();
      if (!course) return null;
      
      const { data: enroll } = await supabase.from("enrollments").select("id").eq("course_id", course.id).eq("user_id", user!.id).maybeSingle();
      const { data: modules } = await supabase.from("modules").select("*").eq("course_id", course.id).order("position");
      
      const moduleIds = (modules ?? []).map((m) => m.id);
      const { data: lessons } = moduleIds.length
        ? await supabase.from("lessons").select("*").in("module_id", moduleIds).order("position")
        : { data: [] as any[] };
        
      const { data: progress } = await supabase.from("lesson_progress").select("*").eq("user_id", user!.id);
      
      const { data: pendingPayment } = await supabase
        .from("payments")
        .select("*")
        .eq("course_id", course.id)
        .eq("user_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      return { 
        course, 
        enrolled: !!enroll, 
        pendingPayment,
        modules: modules ?? [], 
        lessons: lessons ?? [], 
        progress: progress ?? [] 
      };
    },
  });

  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [loadingCheckout, setLoadingCheckout] = useState<boolean>(false);

  const handleCheckout = async () => {
    if (!data?.course || !user) {
      toast.error("Precisas de ter sessão iniciada para adquirir o curso.");
      navigate({ to: "/login", search: { redirect: `/app/curso/${slug}` } });
      return;
    }
    
    try {
      setLoadingCheckout(true);
      const result = await createCheckoutSession({ data: { courseId: data.course.id } });
      
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        toast.error("Falha ao obter o link de pagamento.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar o pagamento");
    } finally {
      setLoadingCheckout(false);
    }
  };

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleUploadReceipt = async () => {
    if (!receiptFile || !data?.pendingPayment || !user) return;
    
    try {
      setUploadingReceipt(true);
      // Upload file to bucket
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${data.pendingPayment.id}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, receiptFile, { upsert: true });

      if (uploadError) throw new Error("Erro ao fazer upload do ficheiro.");

      const { data: publicUrlData } = supabase.storage
        .from('payment-receipts')
        .getPublicUrl(filePath);

      await uploadPaymentReceipt({ data: { paymentId: data.pendingPayment.id, receiptUrl: publicUrlData.publicUrl } });
      
      toast.success("Comprovativo enviado! O administrador irá rever em breve.");
      setIsReceiptModalOpen(false);
      qc.invalidateQueries({ queryKey: ["course-overview", slug] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao anexar comprovativo.");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const progressMap = useMemo(() => {
    const map = new Map<string, { percent: number; is_completed: boolean }>();
    (data?.progress ?? []).forEach((p) => map.set(p.lesson_id, { percent: Number(p.percent), is_completed: p.is_completed }));
    return map;
  }, [data]);

  const flatLessons = useMemo(() => {
    if (!data) return [];
    return data.modules.flatMap((m) => data.lessons.filter((l) => l.module_id === m.id));
  }, [data]);

  const courseStats = useMemo(() => {
    if (!data || flatLessons.length === 0) return { percent: 0, completed: 0, total: 0 };
    const completedCount = flatLessons.filter((l) => progressMap.get(l.id)?.is_completed).length;
    return {
      percent: Math.round((completedCount / flatLessons.length) * 100),
      completed: completedCount,
      total: flatLessons.length
    };
  }, [flatLessons, progressMap, data]);

  const nextLessonToWatch = useMemo(() => {
    if (!data || flatLessons.length === 0) return null;
    return flatLessons.find((l) => !progressMap.get(l.id)?.is_completed) ?? flatLessons[0];
  }, [flatLessons, progressMap, data]);

  function isLessonUnlocked(idx: number) {
    if (idx === 0) return true;
    const prevLesson = flatLessons[idx - 1];
    return progressMap.get(prevLesson.id)?.is_completed === true || !prevLesson.is_locked;
  }

  const handleEnroll = async () => {
    if (!data?.course || !user) return;
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: data.course.id });
    if (error && !error.message.includes("duplicate")) return toast.error(error.message);
    toast.success("Inscrição efetuada com sucesso!");
    qc.invalidateQueries({ queryKey: ["course-overview", slug] });
  };

  const handleStartWatching = () => {
    if (!data?.enrolled) {
      if (data?.course.is_free) {
        handleEnroll().then(() => {
          if (nextLessonToWatch) navigate({ to: "/app/player/$lessonId", params: { lessonId: nextLessonToWatch.id } });
        });
      } else {
        toast.error("Você precisa adquirir este curso primeiro.");
      }
    } else {
      if (nextLessonToWatch) {
        navigate({ to: "/app/player/$lessonId", params: { lessonId: nextLessonToWatch.id } });
      } else {
        toast.error("Este curso ainda não tem aulas.");
      }
    }
  };

  if (isLoading) {
    return <div className="flex h-[50vh] items-center justify-center text-muted-foreground">Carregando curso...</div>;
  }

  if (!data?.course) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-2xl font-bold">Curso não encontrado</h2>
        <p className="text-muted-foreground">O curso que você procura não existe ou foi removido.</p>
        <Button asChild><Link to="/app/cursos">Voltar aos meus cursos</Link></Button>
      </div>
    );
  }

  const c = data.course;

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl bg-secondary text-secondary-foreground shadow-2xl isolate">
        {/* Background Image / Overlay */}
        {c.cover_url && (
          <>
            <img src={c.cover_url} alt="Cover" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-secondary via-secondary/90 to-transparent" />
          </>
        )}
        
        <div className="relative z-10 px-8 py-12 md:px-12 md:py-16 grid lg:grid-cols-[1fr_380px] gap-10 items-center">
          <div className="space-y-6">
            <Link to="/app/cursos" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar para o painel
            </Link>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary border border-primary/30">
                  {c.category || "Curso Completo"}
                </span>
                {courseStats.percent === 100 && (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Concluído
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                {c.title}
              </h1>
              
              <p className="text-lg text-secondary-foreground/80 leading-relaxed max-w-2xl line-clamp-3">
                {c.description || "Nenhuma descrição fornecida."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-secondary-foreground/70">
              {c.instructors && (
                <div className="flex items-center gap-2">
                  {(Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.avatar_url ? (
                    <img src={(Array.isArray(c.instructors) ? c.instructors[0] : c.instructors).avatar_url} alt={(Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.name || "Instrutor"} className="h-8 w-8 rounded-full border border-border" />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {((Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.name || "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-white">{(Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.name || "Instrutor"}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5"><BookOpen className="h-4 w-4 text-primary" /> {flatLessons.length} Aulas</div>
              {c.has_certificate && <div className="flex items-center gap-1.5"><GraduationCap className="h-4 w-4 text-primary" /> Com Certificado</div>}
            </div>
          </div>

          {/* ACTION CARD */}
          <div className="bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">
            <div className="aspect-video rounded-xl overflow-hidden relative shadow-lg">
              {c.cover_url ? (
                <img src={c.cover_url} alt="Thumbnail" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center"><PlayCircle className="h-12 w-12 text-muted-foreground/50" /></div>
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center group cursor-pointer" onClick={handleStartWatching}>
                <div className="bg-primary text-primary-foreground h-14 w-14 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                  <Play className="h-6 w-6 ml-1 fill-current" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {data.enrolled ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-end text-sm font-medium">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="text-2xl font-bold text-white">{courseStats.percent}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${courseStats.percent}%` }} />
                  </div>
                  <div className="text-xs text-center text-muted-foreground">
                    {courseStats.completed} de {courseStats.total} aulas concluídas
                  </div>
                  <Button size="lg" className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20" onClick={handleStartWatching}>
                    {courseStats.percent === 0 ? "Iniciar Curso Agora" : courseStats.percent === 100 ? "Revisar Curso" : "Continuar Assistindo"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <div className="text-3xl font-bold text-white">
                    {c.is_free ? "Gratuito" : `${Number(c.price_mzn).toLocaleString("pt-PT")} MT`}
                  </div>
                  {c.is_free ? (
                    <Button size="lg" className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-900/50" onClick={handleEnroll}>
                      Matricular-se Gratuitamente
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full h-12 text-base font-semibold" onClick={handleCheckout} disabled={loadingCheckout}>
                      {loadingCheckout ? "A processar..." : "Comprar Curso"}
                    </Button>
                  )}
                  {data.pendingPayment && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm text-left shadow-inner">
                      <p className="text-primary font-medium mb-3">Já foste debitado mas o curso não desbloqueou?</p>
                      <Dialog open={isReceiptModalOpen} onOpenChange={setIsReceiptModalOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full text-xs h-9 border-primary/30 text-primary hover:bg-primary/20">
                            Reivindicar Acesso
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle className="text-secondary">Reivindicar Pagamento</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">
                              Anexa uma captura de ecrã do talão de transferência ou a SMS do M-Pesa comprovando o débito. 
                              O nosso administrador fará a aprovação manual o mais rápido possível.
                            </p>
                            <input 
                              type="file" 
                              accept="image/*,.pdf"
                              onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                              className="w-full text-sm text-secondary-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                            />
                            <Button 
                              className="w-full" 
                              onClick={handleUploadReceipt}
                              disabled={!receiptFile || uploadingReceipt}
                            >
                              {uploadingReceipt ? "A enviar..." : "Enviar Comprovativo"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-2">Acesso imediato a todo o conteúdo via PaySuite.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT & MODULES */}
      <div className="grid lg:grid-cols-[1fr_320px] gap-10">
        
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" /> Conteúdo do Curso
            </h2>

            {data.modules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center bg-card">
                <PlayCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Este curso ainda não possui aulas cadastradas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.modules.map((m, mIdx) => {
                  const mLessons = data.lessons.filter(l => l.module_id === m.id);
                  const isExpanded = expandedModules[m.id] ?? (mIdx === 0); // Open first module by default
                  
                  return (
                    <div key={m.id} className="border border-border rounded-2xl overflow-hidden bg-card transition-all">
                      <button 
                        onClick={() => toggleModule(m.id)}
                        className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-left">
                          <h3 className="font-bold text-secondary">{m.title}</h3>
                          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                            <span>{mLessons.length} aulas</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted">
                          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-border bg-background/50 divide-y divide-border/50">
                          {mLessons.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground text-center italic">Nenhuma aula neste módulo.</div>
                          ) : (
                            mLessons.map((l) => {
                              const idx = flatLessons.findIndex(x => x.id === l.id);
                              const unlocked = isLessonUnlocked(idx);
                              const p = progressMap.get(l.id);
                              
                              return (
                                <button 
                                  key={l.id}
                                  disabled={!unlocked || !data.enrolled}
                                  onClick={() => navigate({ to: "/app/player/$lessonId", params: { lessonId: l.id } })}
                                  className={cn(
                                    "w-full flex items-start gap-4 p-4 text-left transition-colors group",
                                    !data.enrolled || !unlocked ? "opacity-60 cursor-not-allowed" : "hover:bg-primary/5 cursor-pointer"
                                  )}
                                >
                                  <div className="mt-0.5 flex-shrink-0">
                                    {!data.enrolled || !unlocked ? (
                                      <Lock className="h-5 w-5 text-muted-foreground" />
                                    ) : p?.is_completed ? (
                                      <CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                    ) : (
                                      <PlayCircle className="h-5 w-5 text-primary group-hover:text-primary/80 transition-colors" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-secondary group-hover:text-primary transition-colors">{l.title}</div>
                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{l.description || "Aula em vídeo"}</div>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR DETAILS */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-bold text-secondary mb-4 uppercase tracking-wider text-xs">Sobre este curso</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Duração Total</div>
                  <div className="font-medium text-secondary">{c.duration_minutes ? `${Math.floor(c.duration_minutes / 60)}h ${c.duration_minutes % 60}m` : "Não informada"}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Aulas</div>
                  <div className="font-medium text-secondary">{flatLessons.length} aulas estruturadas</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Idioma</div>
                  <div className="font-medium text-secondary">{c.language === 'pt' ? 'Português' : c.language === 'en' ? 'Inglês' : c.language || 'Português'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Certificado</div>
                  <div className="font-medium text-secondary">{c.has_certificate ? "Sim, ao concluir" : "Não possui"}</div>
                </div>
              </div>
            </div>
          </div>
          
          {c.instructors && (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="font-bold text-secondary mb-4 uppercase tracking-wider text-xs">O Instrutor</h3>
              <div className="flex gap-4">
                {((Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.avatar_url) ? (
                  <img src={(Array.isArray(c.instructors) ? c.instructors[0] : c.instructors).avatar_url} alt="Instructor" className="h-14 w-14 rounded-full border border-border object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">{((Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.name || "?").charAt(0).toUpperCase()}</div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-secondary">{(Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.name || "Instrutor"}</h3>
                  <div className="text-xs text-primary font-medium mb-2">Criador do Curso</div>
                  {((Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.bio) && <div className="text-sm text-muted-foreground line-clamp-3">{((Array.isArray(c.instructors) ? c.instructors[0] : c.instructors)?.bio)}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
