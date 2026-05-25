import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Check, Heart, MessageSquare, GraduationCap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface NotificationRow {
  id: string;
  user_id: string;
  type: "reply" | "like" | "instructor_reply";
  comment_id: string;
  actor_id: string;
  lesson_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
  actor_profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(`
          id,
          user_id,
          type,
          comment_id,
          actor_id,
          lesson_id,
          message,
          is_read,
          created_at
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Fetch actor profiles for avatars
      const actorIds = Array.from(new Set(data.map((n: any) => n.actor_id).filter(Boolean)));
      const profilesMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();
      
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", actorIds);
        
        (profiles ?? []).forEach((p: any) => {
          profilesMap.set(p.id, p);
        });
      }

      return data.map((n: any) => ({
        ...n,
        actor_profiles: profilesMap.get(n.actor_id) || null
      })) as NotificationRow[];
    }
  });

  // Realtime subscription (unique channel name prevents StrictMode collision)
  useEffect(() => {
    if (!user) return;

    const uid = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`user-notifications-${user.id}-${uid}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, qc]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  async function markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar notificação");
      return;
    }
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
  }

  async function markAllAsRead() {
    if (unreadCount === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user!.id)
      .eq("is_read", false);

    if (error) {
      toast.error("Erro ao marcar todas como lidas");
      return;
    }
    qc.invalidateQueries({ queryKey: ["notifications", user?.id] });
    toast.success("Todas as notificações marcadas como lidas!");
  }

  function handleNotificationClick(n: NotificationRow) {
    setIsOpen(false);
    if (!n.is_read) {
      markAsRead(n.id);
    }
    navigate({
      to: "/app/player/$lessonId",
      params: { lessonId: n.lesson_id },
      hash: `comment-${n.comment_id}`
    });
  }

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-neutral-900 border border-neutral-805 hover:border-neutral-700 hover:bg-neutral-800/80 transition-all text-neutral-400 hover:text-white"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#E50914] text-[10px] font-bold text-white ring-2 ring-neutral-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 shadow-2xl ring-1 ring-black/50 backdrop-blur-xl z-[9999]">
          <div className="flex items-center justify-between border-b border-neutral-850 pb-3 mb-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#E50914]" />
              Notificações
              {unreadCount > 0 && (
                <span className="text-[10px] bg-[#E50914]/15 text-[#E50914] px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} novas
                </span>
              )}
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] font-bold text-neutral-400 hover:text-white flex items-center gap-1 uppercase tracking-wider transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
                Marcar todas como lidas
              </button>
            )}
          </div>

          {/* List of Notifications */}
          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-[#E50914] animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <Bell className="h-8 w-8 text-neutral-800/40 mx-auto mb-2" />
                <p className="text-xs">Nenhuma notificação por aqui.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isInstructorReply = n.type === "instructor_reply";
                const isLike = n.type === "like";
                
                return (
                  <button
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={cn(
                      "w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left border",
                      n.is_read
                        ? "bg-transparent border-transparent hover:bg-neutral-900/50"
                        : "bg-neutral-900/40 border-neutral-900 hover:bg-neutral-900/80 shadow-sm"
                    )}
                  >
                    {/* Icon / Avatar */}
                    <div className="relative flex-shrink-0 mt-0.5">
                      {n.actor_profiles?.avatar_url ? (
                        <img
                          src={n.actor_profiles.avatar_url}
                          alt="Avatar"
                          className="h-8 w-8 rounded-full object-cover border border-neutral-800"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-neutral-850 flex items-center justify-center text-xs font-bold text-neutral-400 border border-neutral-700">
                          {(n.actor_profiles?.full_name || "A").charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Sub-icon badge */}
                      <span className={cn(
                        "absolute -bottom-1 -right-1 rounded-full p-0.5 text-white border border-neutral-950",
                        isLike ? "bg-red-500" : isInstructorReply ? "bg-emerald-500" : "bg-blue-500"
                      )}>
                        {isLike ? (
                          <Heart className="h-2 w-2 fill-white text-white" />
                        ) : isInstructorReply ? (
                          <GraduationCap className="h-2 w-2" />
                        ) : (
                          <MessageSquare className="h-2 w-2" />
                        )}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-xs leading-relaxed",
                        n.is_read ? "text-neutral-400" : "text-neutral-200 font-medium"
                      )}>
                        {n.message}
                      </p>
                      <span className="text-[9px] text-neutral-500 mt-1 block">
                        {new Date(n.created_at).toLocaleDateString("pt-PT", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    {/* Unread indicator */}
                    {!n.is_read && (
                      <div className="h-2 w-2 rounded-full bg-[#E50914] flex-shrink-0 mt-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
