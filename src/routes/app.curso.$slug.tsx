import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { extractYouTubeId } from "@/lib/youtube";
import { Lock, CheckCircle2, Circle, ChevronLeft, ChevronRight, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/app/curso/$slug")({ component: CoursePlayer });

declare global {
  interface Window { YT: any; onYouTubeIframeAPIReady?: () => void; }
}

function useYouTubeAPI() {
  const [ready, setReady] = useState(typeof window !== "undefined" && !!window.YT?.Player);
  useEffect(() => {
    if (ready) return;
    if (typeof window === "undefined") return;
    if (window.YT?.Player) { setReady(true); return; }
    const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existing) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(s);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { prev?.(); setReady(true); };
    const i = setInterval(() => { if (window.YT?.Player) { setReady(true); clearInterval(i); } }, 200);
    return () => clearInterval(i);
  }, [ready]);
  return ready;
}

function CoursePlayer() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ["course-player", slug, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: course } = await supabase.from("courses").select("*").eq("slug", slug).maybeSingle();
      if (!course) return null;
      const { data: enroll } = await supabase.from("enrollments").select("id").eq("course_id", course.id).eq("user_id", user!.id).maybeSingle();
      const { data: modules } = await supabase.from("modules").select("*").eq("course_id", course.id).order("position");
      const moduleIds = (modules ?? []).map((m) => m.id);
      const { data: lessons } = moduleIds.length
        ? await supabase.from("lessons").select("*").in("module_id", moduleIds).order("position")
        : { data: [] as any[] };
      const { data: progress } = await supabase.from("lesson_progress").select("*").eq("user_id", user!.id);
      return { course, enrolled: !!enroll, modules: modules ?? [], lessons: lessons ?? [], progress: progress ?? [] };
    },
  });

  const flatLessons = useMemo(() => {
    if (!data) return [] as any[];
    return data.modules.flatMap((m) => data.lessons.filter((l) => l.module_id === m.id).map((l) => ({ ...l, _module: m })));
  }, [data]);

  const progressMap = useMemo(() => {
    const map = new Map<string, { percent: number; is_completed: boolean }>();
    (data?.progress ?? []).forEach((p) => map.set(p.lesson_id, { percent: Number(p.percent), is_completed: p.is_completed }));
    return map;
  }, [data]);

  const [currentId, setCurrentId] = useState<string | null>(null);
  useEffect(() => {
    if (!currentId && flatLessons.length) {
      const firstUnfinished = flatLessons.find((l) => !progressMap.get(l.id)?.is_completed) ?? flatLessons[0];
      setCurrentId(firstUnfinished.id);
    }
  }, [flatLessons, currentId, progressMap]);

  const currentIndex = flatLessons.findIndex((l) => l.id === currentId);
  const current = currentIndex >= 0 ? flatLessons[currentIndex] : null;
  const prev = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const next = currentIndex >= 0 && currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1] : null;

  function isUnlocked(idx: number) {
    if (idx === 0) return true;
    const prevLesson = flatLessons[idx - 1];
    return progressMap.get(prevLesson.id)?.is_completed === true || !prevLesson.is_locked;
  }

  if (isLoading) return <div className="text-muted-foreground">A carregar curso...</div>;
  if (!data?.course) return <div className="text-muted-foreground">Curso não encontrado.</div>;
  if (!data.enrolled) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold text-secondary">Você ainda não tem acesso a este curso</h2>
        <p className="mt-2 text-muted-foreground">Adquira o curso para começar a assistir as aulas.</p>
        <Button asChild className="mt-4"><Link to="/app/cursos">Ver meus cursos</Link></Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div>
          <Link to="/app/cursos" className="text-sm text-muted-foreground hover:text-primary">← Voltar aos meus cursos</Link>
          <h1 className="mt-2 text-2xl font-bold text-secondary">{data.course.title}</h1>
        </div>

        {current ? (
          <LessonPlayer
            key={current.id}
            lesson={current}
            initialPercent={progressMap.get(current.id)?.percent ?? 0}
            onProgress={async (percent, completed) => {
              await supabase.from("lesson_progress").upsert({
                user_id: user!.id, lesson_id: current.id, percent, is_completed: completed, updated_at: new Date().toISOString(),
              }, { onConflict: "user_id,lesson_id" } as any);
              qc.invalidateQueries({ queryKey: ["course-player", slug] });
              if (completed) toast.success("Aula concluída! Próxima aula desbloqueada.");
            }}
          />
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">Este curso ainda não tem aulas.</div>
        )}

        <div className="flex items-center justify-between">
          <Button variant="outline" disabled={!prev} onClick={() => prev && setCurrentId(prev.id)}>
            <ChevronLeft className="h-4 w-4" /> Aula anterior
          </Button>
          <Button disabled={!next || (current && !progressMap.get(current.id)?.is_completed)} onClick={() => next && setCurrentId(next.id)}>
            Próxima aula <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {current && (
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-semibold text-secondary">{current.title}</h2>
            {current.description && <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">{current.description}</p>}
            {current.attachment_url && (
              <a href={current.attachment_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm text-primary hover:underline">
                <Paperclip className="h-4 w-4" /> Material complementar
              </a>
            )}
          </div>
        )}

        {current && <Comments lessonId={current.id} />}
      </div>

      <aside className="rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Conteúdo</h3>
        <div className="space-y-4">
          {data.modules.map((m) => {
            const moduleLessons = flatLessons.filter((l) => l.module_id === m.id);
            return (
              <div key={m.id}>
                <div className="mb-2 text-sm font-semibold text-secondary">{m.title}</div>
                <div className="space-y-1">
                  {moduleLessons.map((l) => {
                    const idx = flatLessons.findIndex((x) => x.id === l.id);
                    const unlocked = isUnlocked(idx);
                    const p = progressMap.get(l.id);
                    const active = l.id === currentId;
                    return (
                      <button
                        key={l.id}
                        disabled={!unlocked}
                        onClick={() => setCurrentId(l.id)}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition ${
                          active ? "bg-primary/10 text-primary" : unlocked ? "hover:bg-muted text-secondary" : "text-muted-foreground/60 cursor-not-allowed"
                        }`}
                      >
                        {!unlocked ? <Lock className="h-4 w-4 shrink-0" /> : p?.is_completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> : <Circle className="h-4 w-4 shrink-0" />}
                        <span className="flex-1 truncate">{l.title}</span>
                        {p && !p.is_completed && p.percent > 0 && <span className="text-xs">{Math.round(p.percent)}%</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

function LessonPlayer({ lesson, initialPercent, onProgress }: { lesson: any; initialPercent: number; onProgress: (percent: number, completed: boolean) => void }) {
  const videoId = extractYouTubeId(lesson.youtube_url);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const completedRef = useRef(initialPercent >= 90);
  const ytReady = useYouTubeAPI();

  useEffect(() => {
    if (!ytReady || !videoId || !containerRef.current) return;
    playerRef.current = new window.YT.Player(containerRef.current, {
      videoId,
      playerVars: { modestbranding: 1, rel: 0 },
      events: {
        onStateChange: (e: any) => {
          if (e.data === 1) {
            intervalRef.current = setInterval(() => {
              const p = playerRef.current;
              if (!p?.getDuration) return;
              const dur = p.getDuration(); const cur = p.getCurrentTime();
              if (!dur) return;
              const pct = Math.min(100, (cur / dur) * 100);
              if (!completedRef.current && pct >= 90) {
                completedRef.current = true;
                onProgress(pct, true);
              } else if (Math.floor(pct) % 10 === 0) {
                onProgress(pct, completedRef.current);
              }
            }, 2000);
          } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        },
      },
    });
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      try { playerRef.current?.destroy?.(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ytReady, videoId]);

  if (!videoId) {
    return <div className="aspect-video rounded-2xl border border-dashed border-border bg-card flex items-center justify-center text-muted-foreground">Vídeo não configurado para esta aula.</div>;
  }

  return (
    <div className="aspect-video overflow-hidden rounded-2xl bg-black">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function Comments({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [text, setText] = useState("");

  const { data } = useQuery({
    queryKey: ["comments", lessonId],
    queryFn: async () => {
      const { data } = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, profiles(full_name, avatar_url)")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function submit() {
    if (!text.trim() || !user) return;
    const { error } = await supabase.from("comments").insert({ lesson_id: lessonId, user_id: user.id, content: text.trim() });
    if (error) { toast.error("Erro: " + error.message); return; }
    setText(""); qc.invalidateQueries({ queryKey: ["comments", lessonId] });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 font-semibold text-secondary">Comentários</h3>
      <div className="flex gap-2">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Faça uma pergunta ou compartilhe um insight..." rows={2} />
        <Button onClick={submit} disabled={!text.trim()}><Send className="h-4 w-4" /></Button>
      </div>
      <div className="mt-4 space-y-3">
        {(data ?? []).map((c: any) => (
          <div key={c.id} className="rounded-lg border border-border p-3">
            <div className="text-xs text-muted-foreground">{c.profiles?.full_name ?? "Aluno"} · {new Date(c.created_at).toLocaleString("pt-PT")}</div>
            <div className="mt-1 text-sm text-secondary whitespace-pre-wrap">{c.content}</div>
          </div>
        ))}
        {(data ?? []).length === 0 && <div className="text-sm text-muted-foreground">Seja o primeiro a comentar.</div>}
      </div>
    </div>
  );
}