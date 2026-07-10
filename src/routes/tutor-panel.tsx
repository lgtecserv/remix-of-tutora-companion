import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { BookOpen, Users, DollarSign, LayoutDashboard, LogOut, Menu, ChevronLeft, ChevronRight } from "lucide-react";
import logoImg from "@/assets/logo-imersao.png";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/tutor-panel")({
  head: () => ({ meta: [{ title: "Painel do Tutor — Imersão Completa" }, { name: "robots", content: "noindex" }] }),
  component: TutorPanelLayout,
});

function TutorPanelLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [isClient, setIsClient] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isTutor, setIsTutor] = useState<boolean | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && !user && isClient) navigate({ to: "/login" });
  }, [loading, user, navigate, isClient]);

  useEffect(() => {
    async function checkTutorStatus() {
      if (user) {
        // Check profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_tutor")
          .eq("id", user.id)
          .single();

        if (!profile?.is_tutor) {
          toast.error("Acesso negado. Não é um tutor.");
          navigate({ to: "/app" });
          return;
        }

        // Check payment status
        const { data: appData } = await supabase
          .from("tutor_applications")
          .select("status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!appData || appData.status !== "paid") {
          navigate({ to: "/tutor/pagamento" });
          return;
        }

        setIsTutor(true);
      }
    }
    if (user && isClient) {
      checkTutorStatus();
    }
  }, [user, isClient, navigate]);

  if (!isClient || loading || isTutor === null) {
    return <div suppressHydrationWarning className="flex min-h-screen items-center justify-center text-muted-foreground">A verificar acesso...</div>;
  }

  const nav: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
    { to: "/tutor-panel", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/tutor-panel/cursos", label: "Meus Cursos", icon: BookOpen },
    { to: "/tutor-panel/alunos", label: "Meus Alunos", icon: Users },
    { to: "/tutor-panel/financeiro", label: "Carteira", icon: DollarSign },
  ];

  return (
    <div className="flex min-h-screen bg-muted flex-col md:flex-row pt-16 md:pt-0">
      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between border-b border-border bg-card/75 backdrop-blur-xl px-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <Link to="/"><img src={logoImg} alt="Imersão Completa" className="h-16 w-auto object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" /></Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-secondary-foreground hover:bg-secondary">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-secondary text-secondary-foreground border-border w-72 p-0">
            <SheetHeader className="p-5 text-left border-b border-border/20">
              <SheetTitle className="text-secondary-foreground">Painel Tutor</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-full">
              <nav className="flex-1 space-y-1 p-3">
                {nav.map((n) => {
                  const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
                  return (
                    <Link key={n.label} to={n.to as string} className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active ? "bg-primary text-primary-foreground" : "text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground"
                    )}>
                      <n.icon className="h-4 w-4" />{n.label}
                    </Link>
                  );
                })}
              </nav>
              <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground">
                <LogOut className="h-4 w-4" />Sair
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden flex-col border-r border-border bg-secondary text-secondary-foreground md:flex transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="border-b border-border/20 p-5 flex items-center justify-center">
          <Link to="/">
            {isCollapsed ? (
              <img src={logoImg} alt="Imersão Completa" className="h-10 w-auto object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" />
            ) : (
              <img src={logoImg} alt="Imersão Completa" className="h-20 w-auto object-contain invert dark:invert-0 hue-rotate-180 dark:hue-rotate-0" />
            )}
          </Link>
        </div>
        {!isCollapsed && <div className="mt-2 px-5 text-xs font-medium uppercase tracking-wider text-primary">Painel Tutor</div>}
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.label} to={n.to as string} className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300",
                active ? "text-primary" : "text-secondary-foreground/70 hover:text-secondary-foreground"
              )}>
                {active && (
                  <div className="absolute inset-0 rounded-xl bg-primary/10 shadow-[inset_0_0_12px_rgba(234,88,12,0.1)]" />
                )}
                {active && (
                  <div className="absolute left-0 top-1/2 -mt-2 h-4 w-1 rounded-r-full bg-primary" />
                )}
                <n.icon className={cn("relative z-10 h-5 w-5 transition-transform duration-300 shrink-0", active ? "scale-110" : "group-hover:scale-110 group-hover:text-primary")} />
                {!isCollapsed && <span className="relative z-10 truncate">{n.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-border/20 p-3 flex flex-col gap-2">
          <button onClick={() => setIsCollapsed(!isCollapsed)} className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground",
            isCollapsed ? "justify-center" : "gap-2"
          )}>
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!isCollapsed && <span>Recolher</span>}
          </button>
          <button onClick={() => signOut().then(() => navigate({ to: "/" }))} className={cn(
            "flex items-center rounded-lg px-3 py-2 text-sm text-secondary-foreground/70 hover:bg-white/5 hover:text-secondary-foreground",
            isCollapsed ? "justify-center" : "gap-2"
          )}>
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-0 md:p-0 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="p-6 md:p-10"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
