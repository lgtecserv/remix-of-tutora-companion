import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Eye,
  EyeOff,
  Trash2,
  Pin,
  MessageSquare,
  Reply,
  Search,
  Filter,
  CheckSquare,
  Square,
  CornerDownRight,
  TrendingUp,
  AlertCircle,
  ThumbsUp,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/comentarios")({ component: AdminComments });

interface CommentAdminRow {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  lesson_id: string;
  parent_id: string | null;
  is_pinned: boolean;
  is_instructor: boolean;
  is_hidden: boolean;
  profiles: { full_name: string | null; avatar_url: string | null } | null;
  lessons: {
    title: string;
    modules: {
      course_id: string;
      courses: {
        id: string;
        title: string;
      } | null;
    } | null;
  } | null;
  like_count: number;
}

function AdminComments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "visible" | "hidden" | "pinned" | "replies">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  // 1. Fetch comments with relations
  const { data: rawComments = [], isLoading } = useQuery({
    queryKey: ["admin-comments"],
    queryFn: async () => {
      let comments: any[] | null = null;
      
      const res = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          lesson_id,
          parent_id,
          is_pinned,
          is_instructor,
          is_hidden,
          lessons(
            title,
            modules(
              course_id,
              courses(
                id,
                title
              )
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (res.error) {
        console.warn("Admin query with new columns failed, trying fallback to legacy schema:", res.error.message);
        const fallbackRes = await supabase
          .from("comments")
          .select(`
            id,
            content,
            created_at,
            user_id,
            lesson_id,
            is_hidden,
            lessons(
              title,
              modules(
                course_id,
                courses(
                  id,
                  title
                )
              )
            )
          `)
          .order("created_at", { ascending: false });
          
        if (fallbackRes.error) throw fallbackRes.error;
        comments = fallbackRes.data;
      } else {
        comments = res.data;
      }

      if (!comments || comments.length === 0) return [];

      const commentIds = comments.map(c => c.id);
      const userIds = Array.from(new Set(comments.map(c => c.user_id)));

      // Fetch profiles separately (avoids PGRST200 if FK is not defined yet)
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      (profiles ?? []).forEach((p: any) => {
        profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
      });

      // Fetch comment likes count for each (graceful if table doesn't exist yet)
      const likeMap = new Map<string, number>();
      const { data: likes, error: likesError } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .in("comment_id", commentIds);

      if (!likesError && likes) {
        likes.forEach((l: any) => {
          likeMap.set(l.comment_id, (likeMap.get(l.comment_id) ?? 0) + 1);
        });
      }

      return comments.map((c: any) => ({
        ...c,
        parent_id: c.parent_id ?? null,
        is_pinned: c.is_pinned ?? false,
        is_instructor: c.is_instructor ?? false,
        profiles: profileMap.get(c.user_id) || null,
        like_count: likeMap.get(c.id) ?? 0
      })) as CommentAdminRow[];
    }
  });

  // Extract all unique courses for filtering dropdown
  const coursesList = useMemo(() => {
    const map = new Map<string, string>();
    rawComments.forEach((c) => {
      const course = c.lessons?.modules?.courses;
      if (course) {
        map.set(course.id, course.title);
      }
    });
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [rawComments]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = rawComments.length;
    const hidden = rawComments.filter(c => c.is_hidden).length;
    const pinned = rawComments.filter(c => c.is_pinned).length;
    
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const today = rawComments.filter(c => new Date(c.created_at) >= startOfToday).length;

    return { total, hidden, pinned, today };
  }, [rawComments]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    return rawComments.filter((c) => {
      // 1. Text search (comment content or student name)
      const matchesSearch =
        c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.profiles?.full_name ?? "").toLowerCase().includes(searchTerm.toLowerCase());

      // 2. Course filter
      const courseId = c.lessons?.modules?.courses?.id;
      const matchesCourse = courseFilter === "all" || courseId === courseFilter;

      // 3. Status filter
      let matchesStatus = true;
      if (statusFilter === "hidden") matchesStatus = c.is_hidden;
      else if (statusFilter === "visible") matchesStatus = !c.is_hidden;
      else if (statusFilter === "pinned") matchesStatus = c.is_pinned;
      else if (statusFilter === "replies") matchesStatus = c.parent_id !== null;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [rawComments, searchTerm, courseFilter, statusFilter]);

  // Bulk actions
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredComments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredComments.map(c => c.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  async function bulkHide(hide: boolean) {
    if (selectedIds.size === 0) return;
    const idsArray = Array.from(selectedIds);
    
    const { error } = await supabase
      .from("comments")
      .update({ is_hidden: hide })
      .in("id", idsArray);

    if (error) {
      toast.error("Erro ao atualizar comentários: " + error.message);
    } else {
      toast.success(`${selectedIds.size} comentário(s) ${hide ? "ocultado(s)" : "exibido(s)"}!`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
    }
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return;
    if (!confirm(`Tem certeza de que deseja excluir permanentemente os ${selectedIds.size} comentários selecionados?`)) return;
    
    const idsArray = Array.from(selectedIds);
    const { error } = await supabase
      .from("comments")
      .delete()
      .in("id", idsArray);

    if (error) {
      toast.error("Erro ao excluir comentários: " + error.message);
    } else {
      toast.success(`${selectedIds.size} comentário(s) excluído(s) permanentemente!`);
      setSelectedIds(new Set());
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
    }
  }

  // Individual Actions
  async function submitReply(parentComment: CommentAdminRow) {
    if (!replyText.trim() || !user) return;
    const { data: newComment, error } = await supabase.from("comments").insert({
      lesson_id: parentComment.lesson_id,
      parent_id: parentComment.id,
      user_id: user.id,
      content: replyText.trim(),
      is_instructor: true,
    }).select("id").single();

    if (error) {
      toast.error("Erro ao enviar resposta: " + error.message);
      return;
    }

    toast.success("Resposta enviada!");
    setReplyingToId(null);
    setReplyText("");
    qc.invalidateQueries({ queryKey: ["admin-comments"] });

    // Notify user
    if (parentComment.user_id !== user.id) {
      await supabase.from("notifications").insert({
        user_id: parentComment.user_id,
        type: "instructor_reply",
        comment_id: newComment.id,
        actor_id: user.id,
        lesson_id: parentComment.lesson_id,
        message: "O instrutor respondeu ao seu comentário."
      });
    }
  }
  async function toggleHide(c: CommentAdminRow) {
    const { error } = await supabase
      .from("comments")
      .update({ is_hidden: !c.is_hidden })
      .eq("id", c.id);

    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success(c.is_hidden ? "Comentário agora está visível" : "Comentário ocultado");
    }
  }

  async function togglePin(c: CommentAdminRow) {
    const { error } = await supabase
      .from("comments")
      .update({ is_pinned: !c.is_pinned })
      .eq("id", c.id);

    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success(c.is_pinned ? "Comentário desafixado" : "Comentário fixado no topo");
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este comentário permanentemente?")) return;
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["admin-comments"] });
      toast.success("Comentário excluído");
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-5">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-[#E50914]" />
            Gerenciamento de Comentários
          </h1>
          <p className="text-xs text-neutral-400 mt-1.5">
            Monitore, fixe, oculte ou responda às dúvidas dos alunos em todas as aulas.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Comentários", value: stats.total, icon: MessageSquare, color: "text-blue-500 bg-blue-500/5 border-blue-500/10" },
          { label: "Enviados Hoje", value: stats.today, icon: TrendingUp, color: "text-emerald-500 bg-emerald-500/5 border-emerald-500/10" },
          { label: "Fixados", value: stats.pinned, icon: Pin, color: "text-amber-500 bg-amber-500/5 border-amber-500/10" },
          { label: "Ocultados", value: stats.hidden, icon: EyeOff, color: "text-neutral-500 bg-neutral-500/5 border-neutral-500/10" },
        ].map((s) => (
          <div key={s.label} className={cn("p-5 rounded-2xl border flex items-center justify-between shadow-sm", s.color)}>
            <div>
              <div className="text-2xl font-black text-white leading-none">{s.value}</div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 mt-1.5">{s.label}</div>
            </div>
            <s.icon className="h-8 w-8 opacity-40 flex-shrink-0" />
          </div>
        ))}
      </div>

      {/* Filters Dashboard */}
      <div className="bg-neutral-900/50 border border-neutral-850 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por comentário ou aluno..."
            className="w-full bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-xl focus:border-[#E50914] focus:ring-0 outline-none transition-all"
          />
        </div>

        {/* Filters Selects */}
        <div className="flex flex-wrap w-full md:w-auto items-center gap-3">
          {/* Course filter */}
          <div className="relative flex-1 md:flex-initial">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 text-xs text-white pl-9 pr-8 py-2.5 rounded-xl appearance-none outline-none focus:border-[#E50914] transition-all min-w-[140px] w-full"
            >
              <option value="all">Todos os Cursos</option>
              {coursesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="relative flex-1 md:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-neutral-950 border border-neutral-800 text-xs text-white px-4 py-2.5 rounded-xl appearance-none outline-none focus:border-[#E50914] transition-all min-w-[130px] w-full"
            >
              <option value="all">Status: Todos</option>
              <option value="visible">Status: Visíveis</option>
              <option value="hidden">Status: Ocultos</option>
              <option value="pinned">Status: Fixados</option>
              <option value="replies">Status: Respostas</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bulk actions banner */}
      {selectedIds.size > 0 && (
        <div className="bg-neutral-900 border border-[#E50914]/25 p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <CheckSquare className="h-5 w-5 text-[#E50914]" />
            <span className="text-sm font-bold text-white">
              {selectedIds.size} comentário(s) selecionado(s)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkHide(false)}
              className="h-9 rounded-xl text-emerald-400 hover:text-emerald-350 border-neutral-800 hover:bg-neutral-800"
            >
              <Eye className="h-4 w-4 mr-1.5" /> Exibir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkHide(true)}
              className="h-9 rounded-xl text-neutral-400 hover:text-white border-neutral-800 hover:bg-neutral-800"
            >
              <EyeOff className="h-4 w-4 mr-1.5" /> Ocultar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={bulkDelete}
              className="h-9 rounded-xl text-red-500 hover:text-red-450 hover:bg-red-950/20"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Excluir
            </Button>
          </div>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-20">
          <div className="h-10 w-10 text-[#E50914] animate-spin border-2 border-current border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-neutral-400">Carregando comentários...</p>
        </div>
      ) : filteredComments.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-neutral-850 rounded-3xl bg-neutral-950/30">
          <AlertCircle className="h-12 w-12 text-neutral-700 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Nenhum comentário encontrado</h3>
          <p className="text-xs text-neutral-500 mt-1">
            Altere os filtros de pesquisa para visualizar outros comentários.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 hover:text-neutral-350"
            >
              {selectedIds.size === filteredComments.length ? (
                <CheckSquare className="h-4 w-4 text-[#E50914]" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Selecionar Todos ({filteredComments.length})
            </button>
            <span>Ações</span>
          </div>

          {/* Cards */}
          <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1 custom-scrollbar">
            {filteredComments.map((c) => {
              const isSelected = selectedIds.has(c.id);
              const courseTitle = c.lessons?.modules?.courses?.title || "Sem Curso";
              const lessonTitle = c.lessons?.title || "Sem Aula";
              const dateStr = new Date(c.created_at).toLocaleString("pt-PT", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
                hour: "2-digit",
                minute: "2-digit"
              });

              return (
                <div
                  key={c.id}
                  className={cn(
                    "group relative border rounded-2xl p-4 transition-all flex flex-col gap-4",
                    c.is_hidden
                      ? "bg-neutral-950/40 border-neutral-900 opacity-60"
                      : c.is_pinned
                        ? "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/30"
                        : c.is_instructor
                          ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/30"
                          : "bg-neutral-900/30 border-neutral-850 hover:bg-neutral-900/50 hover:border-neutral-800",
                    isSelected && "border-[#E50914]/40 bg-[#E50914]/5"
                  )}
                >
                  {/* Row Content */}
                  <div className="flex items-start gap-4 w-full">
                    {/* Select Checkbox */}
                  <button
                    onClick={() => toggleSelectOne(c.id)}
                    className="mt-1 text-neutral-600 hover:text-white transition-colors"
                  >
                    {isSelected ? (
                      <CheckSquare className="h-4.5 w-4.5 text-[#E50914]" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>

                  {/* Avatar */}
                  <div className="flex-shrink-0 mt-0.5">
                    {c.profiles?.avatar_url ? (
                      <img
                        src={c.profiles.avatar_url}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full object-cover border border-neutral-800 shadow-inner"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-neutral-850 flex items-center justify-center text-sm font-bold text-neutral-400 border border-neutral-700 shadow-inner">
                        {(c.profiles?.full_name || "A").charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info Column */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {c.profiles?.full_name ?? "Aluno Anônimo"}
                      </span>

                      {/* Breadcrumbs */}
                      <Link 
                        to="/app/player/$lessonId"
                        params={{ lessonId: c.lesson_id }}
                        hash={`comment-${c.id}`}
                        className="text-[10px] text-neutral-400 bg-neutral-950 px-2.5 py-1 rounded-md border border-neutral-800 hover:border-neutral-600 hover:text-white font-medium transition-colors cursor-pointer flex items-center leading-tight"
                        title="Ir para a aula comentar"
                      >
                        {courseTitle} → {lessonTitle}
                      </Link>

                      {/* Badges */}
                      {c.is_instructor && (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Instrutor
                        </span>
                      )}
                      {c.is_pinned && (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          Fixado
                        </span>
                      )}
                      {c.parent_id && (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                          <CornerDownRight className="h-2.5 w-2.5" /> Resposta
                        </span>
                      )}
                    </div>

                    {/* Content text */}
                    <p className="mt-2 text-sm text-neutral-300 whitespace-pre-wrap break-words leading-relaxed">
                      {c.content}
                    </p>

                    {/* Bottom Metadata */}
                    <div className="flex items-center gap-4 mt-3 text-[10px] font-medium text-neutral-500">
                      <span>{dateStr}</span>
                      {c.like_count > 0 && (
                        <span className="flex items-center gap-1 text-neutral-400">
                          <ThumbsUp className="h-3 w-3 text-red-500" /> {c.like_count} curtida(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex gap-1.5 self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setReplyingToId(replyingToId === c.id ? null : c.id);
                        setReplyText("");
                      }}
                      className={cn(
                        "h-9 w-9 p-0 rounded-xl border-neutral-800 transition-all",
                        replyingToId === c.id ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "hover:bg-neutral-800 text-neutral-400 hover:text-blue-500"
                      )}
                      title="Responder comentário"
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePin(c)}
                      className={cn(
                        "h-9 w-9 p-0 rounded-xl border-neutral-800 hover:bg-neutral-800 transition-all",
                        c.is_pinned ? "text-amber-500 border-amber-500/20" : "text-neutral-400 hover:text-amber-500"
                      )}
                      title={c.is_pinned ? "Desafixar" : "Fixar no topo"}
                    >
                      <Pin className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleHide(c)}
                      className={cn(
                        "h-9 w-9 p-0 rounded-xl border-neutral-800 hover:bg-neutral-800 transition-all",
                        c.is_hidden ? "text-[#E50914] border-[#E50914]/20" : "text-neutral-400 hover:text-white"
                      )}
                      title={c.is_hidden ? "Exibir Comentário" : "Ocultar Comentário"}
                    >
                      {c.is_hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(c.id)}
                      className="h-9 w-9 p-0 rounded-xl text-neutral-500 hover:text-red-500 hover:bg-red-950/20 transition-all"
                      title="Excluir Comentário"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  </div>

                  {/* Inline Reply Box */}
                  {replyingToId === c.id && (
                    <div className="mt-1 pl-12 flex items-start gap-3 w-full animate-in slide-in-from-top-2 fade-in duration-200">
                      <div className="flex-1 relative">
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escreva sua resposta (como instrutor)..."
                          className="w-full bg-neutral-950 border border-neutral-800 text-sm text-white placeholder-neutral-500 px-4 py-3 pb-12 rounded-xl focus:border-blue-500 outline-none resize-none min-h-[100px] transition-colors"
                        />
                        <div className="absolute bottom-2 right-2 flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingToId(null)}
                            className="h-8 rounded-lg text-neutral-400 hover:text-white"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => submitReply(c)}
                            disabled={!replyText.trim()}
                            className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                          >
                            Responder
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}