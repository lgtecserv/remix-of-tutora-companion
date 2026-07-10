import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, BookOpen, Users, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/tutor-panel/")({
  component: TutorDashboard,
});

function TutorDashboard() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["tutor-stats"],
    queryFn: async () => {
      if (!user) return null;

      const [walletRes, coursesRes, enrollmentsRes] = await Promise.all([
        supabase.from("tutor_wallet").select("*").eq("tutor_id", user.id).single(),
        supabase.from("courses").select("id").eq("tutor_id", user.id),
        // Simplification: Count all enrollments for courses owned by this tutor
        supabase.rpc("get_tutor_enrollments_count", { p_tutor_id: user.id }).maybeSingle(),
      ]);

      return {
        wallet: walletRes.data,
        coursesCount: coursesRes.data?.length || 0,
        studentsCount: enrollmentsRes.data || 0,
      };
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Bem-vindo ao seu painel de tutor.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.wallet?.balance?.toFixed(2) || "0.00"} MT</div>
            <p className="text-xs text-muted-foreground">Pronto para saque</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.wallet?.total_earned?.toFixed(2) || "0.00"} MT</div>
            <p className="text-xs text-muted-foreground">Historicamente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Meus Cursos</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.coursesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Cursos publicados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.studentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Em todos os cursos</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
