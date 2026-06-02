import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, MousePointerClick, Eye, TrendingUp } from "lucide-react";
import React from "react";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { data: posts } = useQuery({
    queryKey: ["analytics-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blog_posts")
        .select("id, title, views_count, clicks_count, created_at")
        .order("views_count", { ascending: false });
      return data || [];
    },
  });

  const { data: banners } = useQuery({
    queryKey: ["analytics-banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("custom_banners")
        .select("id, name, placement, views_count, clicks_count, is_active")
        .order("views_count", { ascending: false });
      return data || [];
    },
  });

  const totalViews = (posts?.reduce((acc, p) => acc + (p.views_count || 0), 0) || 0) + 
                     (banners?.reduce((acc, b) => acc + (b.views_count || 0), 0) || 0);

  const totalClicks = (posts?.reduce((acc, p) => acc + (p.clicks_count || 0), 0) || 0) + 
                      (banners?.reduce((acc, b) => acc + (b.clicks_count || 0), 0) || 0);

  const calculateCTR = (clicks: number, views: number) => {
    if (!views) return "0.00";
    return ((clicks / views) * 100).toFixed(2);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2 mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
          <BarChart3 className="w-8 h-8 text-orange-500" />
          Analytics & Crescimento
        </h1>
        <p className="text-zinc-400">Acompanhe as métricas vitais de leitura e publicidade.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Eye className="w-16 h-16 text-blue-500" />
          </div>
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total de Impressões</h3>
          <p className="text-4xl font-black text-white">{totalViews.toLocaleString()}</p>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MousePointerClick className="w-16 h-16 text-orange-500" />
          </div>
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total de Cliques</h3>
          <p className="text-4xl font-black text-white">{totalClicks.toLocaleString()}</p>
        </div>

        <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp className="w-16 h-16 text-green-500" />
          </div>
          <h3 className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">CTR Médio (Geral)</h3>
          <p className="text-4xl font-black text-white">{calculateCTR(totalClicks, totalViews)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Posts Table */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/10 bg-zinc-800/50">
            <h2 className="text-lg font-bold text-white">Artigos Mais Lidos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/30 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-white/10">Artigo</th>
                  <th className="p-4 font-medium border-b border-white/10 text-right">Views</th>
                  <th className="p-4 font-medium border-b border-white/10 text-right">Cliques</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {posts?.map((post) => (
                  <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-white font-medium max-w-[200px] truncate" title={post.title}>
                      {post.title}
                    </td>
                    <td className="p-4 text-zinc-300 text-right">{post.views_count || 0}</td>
                    <td className="p-4 text-zinc-300 text-right">{post.clicks_count || 0}</td>
                  </tr>
                ))}
                {!posts?.length && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-zinc-500">Nenhum artigo encontrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Banners Table */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/10 bg-zinc-800/50">
            <h2 className="text-lg font-bold text-white">Desempenho de Banners</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-800/30 text-zinc-400 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium border-b border-white/10">Banner</th>
                  <th className="p-4 font-medium border-b border-white/10 text-right">Impressões</th>
                  <th className="p-4 font-medium border-b border-white/10 text-right">Cliques (CTR)</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-white/5">
                {banners?.map((banner) => (
                  <tr key={banner.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-white font-medium max-w-[200px] truncate" title={banner.name}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${banner.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                        {banner.name}
                      </div>
                    </td>
                    <td className="p-4 text-zinc-300 text-right">{banner.views_count || 0}</td>
                    <td className="p-4 text-zinc-300 text-right">
                      {banner.clicks_count || 0} 
                      <span className="text-xs text-zinc-500 ml-1">
                        ({calculateCTR(banner.clicks_count || 0, banner.views_count || 0)}%)
                      </span>
                    </td>
                  </tr>
                ))}
                {!banners?.length && (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-zinc-500">Nenhum banner ativo.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
