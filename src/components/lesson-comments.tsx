import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Heart,
  MessageSquare,
  Pin,
  Shield,
  GraduationCap,
  CornerDownRight,
  Loader2,
  Filter,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────
interface CommentRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  is_pinned: boolean;
  is_instructor: boolean;
  is_hidden: boolean;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  like_count: number;
  user_liked: boolean;
}

type SortMode = "recent" | "popular" | "instructor";

// ─── Helpers ─────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  return `${months}mês${months > 1 ? "es" : ""}`;
}

function sanitize(text: string): string {
  return text.replace(/<[^>]*>/g, "").trim().slice(0, 1000);
}

// ─── Main Component ─────────────────────────────────────────────
export default function LessonComments({
  lessonId,
  courseInstructorId,
}: {
  lessonId: string;
  courseInstructorId?: string | null;
}) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [sort, setSort] = useState<SortMode>("recent");

  // ── Fetch comments ──
  const { data: rawComments = [], isLoading } = useQuery({
    queryKey: ["lesson-comments", lessonId],
    queryFn: async () => {
      let comments: any[] | null = null;
      let queryError: any = null;

      // 1. Try querying with the new schema columns
      const res = await supabase
        .from("comments")
        .select("id, content, created_at, user_id, parent_id, is_pinned, is_instructor, is_hidden")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

      if (res.error) {
        console.warn("Querying comments with new schema failed, falling back to legacy schema:", res.error.message);
        // Fallback to legacy schema
        const fallbackRes = await supabase
          .from("comments")
          .select("id, content, created_at, user_id, is_hidden, lesson_id")
          .eq("lesson_id", lessonId)
          .order("created_at", { ascending: true });

        comments = fallbackRes.data;
        queryError = fallbackRes.error;
      } else {
        comments = res.data;
      }

      if (queryError) throw queryError;
      if (!comments || comments.length === 0) return [];

      const commentIds = comments.map((c: any) => c.id);
      const userIds = Array.from(new Set(comments.map((c: any) => c.user_id)));

      // 2. Fetch profiles separately (avoids PGRST200 if FK is not defined yet)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      (profiles ?? []).forEach((p: any) => {
        profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });

      // 3. Get like counts (graceful if table doesn't exist yet)
      const { data: likeCounts, error: likesError } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds);

      const likeMap = new Map<string, number>();
      if (!likesError && likeCounts) {
        likeCounts.forEach((l: any) => {
          likeMap.set(l.comment_id, (likeMap.get(l.comment_id) ?? 0) + 1);
        });
      }

      // 4. Get user's likes (graceful if table doesn't exist yet)
      let userLikedSet = new Set<string>();
      if (user) {
        const { data: userLikes, error: userLikesError } = await supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", user.id)
          .in("comment_id", commentIds);
        
        if (!userLikesError && userLikes) {
          userLikedSet = new Set(userLikes.map((l: any) => l.comment_id));
        }
      }

      return comments.map((c: any) => ({
        id: c.id,
        content: c.content,
        created_at: c.created_at,
        user_id: c.user_id,
        parent_id: c.parent_id ?? null,
        is_pinned: c.is_pinned ?? false,
        is_instructor: c.is_instructor ?? (courseInstructorId && c.user_id === courseInstructorId) ?? false,
        is_hidden: c.is_hidden ?? false,
        profiles: profileMap.get(c.user_id) || null,
        like_count: likeMap.get(c.id) ?? 0,
        user_liked: userLikedSet.has(c.id),
      })) as CommentRow[];
    },
  });

  // ── Realtime subscription (unique channel name prevents StrictMode collision) ──
  useEffect(() => {
    const uid = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`comments-${lessonId}-${uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "comments", filter: `lesson_id=eq.${lessonId}` }, () => {
        qc.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comment_likes" }, () => {
        qc.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [lessonId, qc]);

  // Scroll to target comment
  useEffect(() => {
    if (isLoading || rawComments.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const commentId = params.get("commentId") || window.location.hash.replace("#comment-", "");
    if (commentId) {
      setTimeout(() => {
        const element = document.getElementById(`comment-${commentId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("ring-2", "ring-[#E50914]", "ring-offset-2", "ring-offset-black");
          setTimeout(() => {
            element.classList.remove("ring-2", "ring-[#E50914]", "ring-offset-2", "ring-offset-black");
          }, 3000);
        }
      }, 500);
    }
  }, [isLoading, rawComments]);

  // ── Organize comments into tree ──
  const { rootComments, repliesMap, totalCount } = useMemo(() => {
    let filtered = rawComments.filter((c) => !c.is_hidden);

    const replies = new Map<string, CommentRow[]>();
    const roots: CommentRow[] = [];

    filtered.forEach((c) => {
      if (c.parent_id) {
        const arr = replies.get(c.parent_id) ?? [];
        arr.push(c);
        replies.set(c.parent_id, arr);
      } else {
        roots.push(c);
      }
    });

    // Sort roots
    let sorted = [...roots];
    if (sort === "popular") {
      sorted.sort((a, b) => b.like_count - a.like_count);
    } else if (sort === "instructor") {
      sorted = sorted.filter((c) => c.is_instructor);
    } else {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Pinned comments always first
    const pinned = sorted.filter((c) => c.is_pinned);
    const unpinned = sorted.filter((c) => !c.is_pinned);

    return {
      rootComments: [...pinned, ...unpinned],
      repliesMap: replies,
      totalCount: filtered.length,
    };
  }, [rawComments, sort]);

  return (
    <div className="space-y-5 w-full min-w-0" ref={scrollRef}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#E50914]" />
          Comunidade
          {totalCount > 0 && (
            <span className="bg-neutral-800 text-neutral-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {totalCount}
            </span>
          )}
        </h3>

        {/* Sort filter */}
        <div className="flex gap-1">
          {(
            [
              { key: "recent", label: "Recentes" },
              { key: "popular", label: "Populares" },
              { key: "instructor", label: "Instrutor" },
            ] as const
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setSort(f.key)}
              className={cn(
                "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                sort === f.key
                  ? "bg-[#E50914] text-white"
                  : "bg-neutral-900 text-neutral-400 hover:text-white hover:bg-neutral-800"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* New comment input */}
      <CommentInput
        lessonId={lessonId}
        courseInstructorId={courseInstructorId}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
          scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
        }}
      />

      {/* Comments list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 text-[#E50914] animate-spin" />
        </div>
      ) : rootComments.length === 0 ? (
        <div className="text-center py-10">
          <MessageSquare className="h-10 w-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-sm text-neutral-500 font-medium">
            {sort === "instructor"
              ? "Nenhum comentário do instrutor ainda."
              : "Nenhuma dúvida enviada ainda. Seja o primeiro a perguntar!"}
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
          {rootComments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              replies={repliesMap.get(c.id) ?? []}
              lessonId={lessonId}
              courseInstructorId={courseInstructorId}
              depth={0}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Comment Input ──────────────────────────────────────────────
function CommentInput({
  lessonId,
  parentId,
  courseInstructorId,
  onSuccess,
  onCancel,
  autoFocus = false,
  compact = false,
}: {
  lessonId: string;
  parentId?: string;
  courseInstructorId?: string | null;
  onSuccess: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const charCount = text.length;
  const isOverLimit = charCount > 1000;

  async function submit() {
    if (!text.trim() || !user || isOverLimit) return;
    setSending(true);

    const isInstructor = courseInstructorId === user.id;
    const cleanContent = sanitize(text);

    const { error } = await supabase.from("comments").insert({
      lesson_id: lessonId,
      user_id: user.id,
      content: cleanContent,
      parent_id: parentId ?? null,
      is_instructor: isInstructor,
    });

    if (error) {
      toast.error("Erro ao enviar: " + error.message);
      setSending(false);
      return;
    }

    // Create notification for parent comment author
    if (parentId) {
      const { data: parentComment } = await supabase
        .from("comments")
        .select("user_id")
        .eq("id", parentId)
        .single();

      if (parentComment && parentComment.user_id !== user.id) {
        const profile = user.user_metadata?.full_name || user.email?.split("@")[0] || "Alguém";
        await supabase.from("notifications").insert({
          user_id: parentComment.user_id,
          type: isInstructor ? "instructor_reply" : "reply",
          comment_id: parentId,
          actor_id: user.id,
          lesson_id: lessonId,
          message: isInstructor
            ? `O instrutor respondeu ao seu comentário`
            : `${profile} respondeu ao seu comentário`,
        });
      }
    }

    setText("");
    setSending(false);
    toast.success("Comentário enviado!");
    onSuccess();
  }

  if (!user) return null;

  const profileName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Aluno";
  const avatarUrl = user.user_metadata?.avatar_url;

  return (
    <div className={cn("flex gap-2 md:gap-3", compact && "pl-4 md:pl-8")}>
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        {avatarUrl ? (
          <img src={avatarUrl} alt={profileName} className="h-9 w-9 rounded-full object-cover border border-neutral-700" />
        ) : (
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#E50914] to-red-700 flex items-center justify-center text-white text-sm font-bold border border-neutral-700">
            {profileName.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="flex-1 min-w-0 space-y-2">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={parentId ? "Escreva a sua resposta..." : "Faça uma pergunta ou compartilhe um insight sobre esta aula..."}
          className={cn(
            "bg-neutral-900/80 border-neutral-800 text-white placeholder-neutral-500 rounded-xl focus-visible:ring-[#E50914] focus-visible:ring-1 focus-visible:ring-offset-0 resize-none transition-all",
            compact ? "min-h-[42px] text-sm" : "min-h-[56px]"
          )}
          rows={compact ? 1 : 2}
          maxLength={1000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />

        <div className="flex items-center justify-between">
          <span className={cn("text-[10px] font-medium", isOverLimit ? "text-red-500" : "text-neutral-600")}>
            {charCount}/1000
          </span>

          <div className="flex gap-2">
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} className="h-8 text-xs text-neutral-400 hover:text-white">
                Cancelar
              </Button>
            )}
            <Button
              onClick={submit}
              disabled={!text.trim() || sending || isOverLimit}
              size="sm"
              className="h-8 bg-[#E50914] hover:bg-[#b80710] text-white rounded-lg text-xs font-semibold gap-1.5 px-4 disabled:opacity-40"
            >
              {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Enviar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Comment Card ───────────────────────────────────────────────
function CommentCard({
  comment: c,
  replies,
  lessonId,
  courseInstructorId,
  depth,
}: {
  comment: CommentRow;
  replies: CommentRow[];
  lessonId: string;
  courseInstructorId?: string | null;
  depth: number;
}) {
  const { user } = useAuth();
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const [showReplyInput, setShowReplyInput] = useState(false);

  const targetCommentId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("commentId") || window.location.hash.replace("#comment-", "");
  }, []);

  const [showReplies, setShowReplies] = useState(
    depth === 0 && (replies.length <= 3 || (targetCommentId && replies.some(r => r.id === targetCommentId)))
  );
  const [liking, setLiking] = useState(false);

  const name = c.profiles?.full_name ?? "Aluno";
  const avatarUrl = c.profiles?.avatar_url;

  async function toggleLike() {
    if (!user || liking) return;
    setLiking(true);

    if (c.user_liked) {
      await supabase.from("comment_likes").delete().eq("comment_id", c.id).eq("user_id", user.id);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: c.id, user_id: user.id });

      // Notification
      if (c.user_id !== user.id) {
        const profile = user.user_metadata?.full_name || user.email?.split("@")[0] || "Alguém";
        await supabase.from("notifications").insert({
          user_id: c.user_id,
          type: "like",
          comment_id: c.id,
          actor_id: user.id,
          lesson_id: lessonId,
          message: `${profile} curtiu o seu comentário`,
        });
      }
    }

    qc.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
    setLiking(false);
  }

  async function togglePin() {
    await supabase.from("comments").update({ is_pinned: !c.is_pinned }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
    toast.success(c.is_pinned ? "Comentário desafixado" : "Comentário fixado no topo");
  }

  async function deleteComment() {
    if (!confirm("Tem certeza que deseja excluir este comentário?")) return;
    await supabase.from("comments").delete().eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
    toast.success("Comentário excluído");
  }

  return (
    <div id={`comment-${c.id}`} className={cn("group", depth > 0 && "ml-3 pl-2 md:ml-8 md:pl-4 border-l-2 border-neutral-800/60 transition-all duration-300 rounded-xl")}>
      <div
        className={cn(
          "rounded-xl p-3 md:p-4 transition-all",
          c.is_pinned && "bg-amber-500/5 border border-amber-500/20",
          c.is_instructor && !c.is_pinned && "bg-emerald-500/5 border border-emerald-500/15",
          !c.is_pinned && !c.is_instructor && "bg-neutral-900/30 border border-neutral-800/50 hover:bg-neutral-900/50"
        )}
      >
        {/* Pinned badge */}
        {c.is_pinned && (
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">
            <Pin className="h-3 w-3" /> Fixado
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Avatar */}
            {avatarUrl ? (
              <img src={avatarUrl} alt={name} className={cn("rounded-full object-cover border shrink-0", c.is_instructor ? "h-9 w-9 border-emerald-500/50" : "h-8 w-8 border-neutral-700")} />
            ) : (
              <div
                className={cn(
                  "rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                  c.is_instructor ? "h-9 w-9 bg-gradient-to-br from-emerald-500 to-teal-600 border border-emerald-500/50" : "h-8 w-8 bg-gradient-to-br from-neutral-700 to-neutral-800 border border-neutral-600"
                )}
              >
                {name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("text-sm font-semibold truncate", c.is_instructor ? "text-emerald-400" : "text-neutral-200")}>
                  {name}
                </span>

                {/* Badges */}
                {c.is_instructor && (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    <GraduationCap className="h-3 w-3" /> Instrutor
                  </span>
                )}
              </div>
              <span className="text-[10px] text-neutral-500">{timeAgo(c.created_at)}</span>
            </div>
          </div>

          {/* Admin actions */}
          {isAdmin && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={togglePin} title={c.is_pinned ? "Desafixar" : "Fixar"} className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-amber-500 transition-colors">
                <Pin className="h-3.5 w-3.5" />
              </button>
              <button onClick={deleteComment} title="Excluir" className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-2.5 text-sm text-neutral-300 whitespace-pre-wrap break-words leading-relaxed">
          {c.content}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={toggleLike}
            disabled={liking}
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium transition-all group/like",
              c.user_liked ? "text-red-500" : "text-neutral-500 hover:text-red-400"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5 transition-transform group-hover/like:scale-110", c.user_liked && "fill-red-500")} />
            {c.like_count > 0 && <span>{c.like_count}</span>}
          </button>

          {depth === 0 && (
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-[#E50914] transition-colors"
            >
              <CornerDownRight className="h-3.5 w-3.5" />
              Responder
            </button>
          )}

          {depth === 0 && replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-white transition-colors ml-auto"
            >
              {showReplies ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {replies.length} {replies.length === 1 ? "resposta" : "respostas"}
            </button>
          )}
        </div>
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="mt-2">
          <CommentInput
            lessonId={lessonId}
            parentId={c.id}
            courseInstructorId={courseInstructorId}
            compact
            autoFocus
            onSuccess={() => {
              setShowReplyInput(false);
              setShowReplies(true);
              qc.invalidateQueries({ queryKey: ["lesson-comments", lessonId] });
            }}
            onCancel={() => setShowReplyInput(false)}
          />
        </div>
      )}

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className="mt-2 space-y-2">
          {replies.map((r) => (
            <CommentCard
              key={r.id}
              comment={r}
              replies={[]}
              lessonId={lessonId}
              courseInstructorId={courseInstructorId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
