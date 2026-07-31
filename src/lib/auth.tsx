import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "aluno";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: Role[];
  isAdmin: boolean;
  isTutorPending: boolean;
  isTutorApproved: boolean;
  isTutorRejected: boolean;
  tutorRejectionReason: string | null;
  tutorSubmissionCount: number;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isTutorPending, setIsTutorPending] = useState(false);
  const [isTutorApproved, setIsTutorApproved] = useState(false);
  const [isTutorRejected, setIsTutorRejected] = useState(false);
  const [tutorRejectionReason, setTutorRejectionReason] = useState<string | null>(null);
  const [tutorSubmissionCount, setTutorSubmissionCount] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let didResolve = false;

    const finish = () => {
      if (isMounted && !didResolve) {
        didResolve = true;
        setLoading(false);
      }
    };

    const loadRoles = async (userId: string): Promise<Role[]> => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (error) return [];
        return (data ?? []).map((r) => r.role as Role);
      } catch {
        return [];
      }
    };

    const loadTutorStatus = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("tutor_applications")
          .select("status, rejection_reason, submission_count")
          .eq("user_id", userId)
          .maybeSingle();
        if (error || !data) return { pending: false, approved: false, rejected: false, reason: null, count: 1 };
        return {
          pending: data.status === "pending",
          approved: data.status === "paid",
          rejected: data.status === "rejected",
          reason: data.rejection_reason || null,
          count: data.submission_count || 1
        };
      } catch {
        return { pending: false, approved: false, rejected: false, reason: null, count: 1 };
      }
    };

    const handleSession = async (s: Session | null) => {
      if (!isMounted) return;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        const [r, tutorStatus] = await Promise.all([
          loadRoles(s.user.id),
          loadTutorStatus(s.user.id)
        ]);
        if (!isMounted) return;
        setRoles(r);
        setIsTutorPending(tutorStatus.pending);
        setIsTutorApproved(tutorStatus.approved);
        setIsTutorRejected(tutorStatus.rejected);
        setTutorRejectionReason(tutorStatus.reason);
        setTutorSubmissionCount(tutorStatus.count);
      } else {
        setRoles([]);
        setIsTutorPending(false);
        setIsTutorApproved(false);
        setIsTutorRejected(false);
        setTutorRejectionReason(null);
        setTutorSubmissionCount(1);
      }
      finish();
    };

    // Strategy 1: Use onAuthStateChange (fires INITIAL_SESSION immediately)
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s);
    });

    // Strategy 2: Fallback — use getSession in case onAuthStateChange doesn't fire
    setTimeout(() => {
      if (!didResolve) {
        supabase.auth.getSession().then(({ data }) => {
          if (!didResolve) handleSession(data.session);
        }).catch(() => finish());
      }
    }, 500);

    // Strategy 3: Hard timeout — force resolve after 3 seconds no matter what
    const hardTimeout = setTimeout(() => {
      if (!didResolve) {
        console.warn("[Auth] Hard timeout — forcing loading=false");
        finish();
      }
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(hardTimeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    roles,
    isAdmin: roles.includes("admin"),
    isTutorPending,
    isTutorApproved,
    isTutorRejected,
    tutorRejectionReason,
    tutorSubmissionCount,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}