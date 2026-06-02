import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, MousePointerClick, Eye, TrendingUp, Calendar, Monitor, Smartphone, Globe } from "lucide-react";
import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { format, subDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const [daysFilter, setDaysFilter] = useState<number>(7);

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

  const { data: events } = useQuery({
    queryKey: ["analytics-events", daysFilter],
    queryFn: async () => {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - daysFilter);
      
      const { data } = await supabase
        .from("analytics_events")
        .select("*")
        .gte("created_at", dateLimit.toISOString())
        .order("created_at", { ascending: true });
      return data || [];
    },
  });

  // Calculate Chart Data
  const chartData = React.useMemo(() => {
    if (!events) return [];
    
    // Group by date
    const grouped = events.reduce((acc: any, event) => {
      const date = event.created_at.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, views: 0, clicks: 0 };
      }
      if (event.event_type === "view") acc[date].views++;
      if (event.event_type === "click") acc[date].clicks++;
      return acc;
    }, {});

    // Ensure all days in range are present
    const result = [];
    for (let i = daysFilter - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        displayDate: format(d, "dd MMM", { locale: ptBR }),
        views: grouped[dateStr]?.views || 0,
        clicks: grouped[dateStr]?.clicks || 0,
      });
    }
    return result;
  }, [events, daysFilter]);

  // Aggregate Referrers
  const topReferrers = React.useMemo(() => {
    if (!events) return [];
    const refs = events.reduce((acc: any, ev) => {
      if (ev.event_type === "view" && ev.referrer) {
        try {
          const domain = new URL(ev.referrer).hostname;
          acc[domain] = (acc[domain] || 0) + 1;
        } catch(e) {
          acc["Direto / Desconhecido"] = (acc["Direto / Desconhecido"] || 0) + 1;
        }
      }
      return acc;
    }, {});
    
    return Object.entries(refs)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [events]);

  // Devices
  const devices = React.useMemo(() => {
    if (!events) return { mobile: 0, desktop: 0 };
    return events.reduce((acc, ev) => {
      if (ev.event_type === "view") {
        if (ev.device_type === "mobile") acc.mobile++;
        else if (ev.device_type === "desktop") acc.desktop++;
      }
      return acc;
    }, { mobile: 0, desktop: 0 });
  }, [events]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <BarChart3 className="w-8 h-8 text-orange-500" />
            Analytics de Tempo Real
          </h1>
          <p className="text-zinc-400">Acompanhe as métricas de leitura e publicidade (Time-Series).</p>
        </div>
        <div className="flex bg-zinc-900 border border-white/10 rounded-lg p-1">
          {[7, 14, 30].map(days => (
            <button
              key={days}
              onClick={() => setDaysFilter(days)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${daysFilter === days ? 'bg-orange-500 text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            >
              {days} Dias
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

      {/* Main Chart */}
      <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl p-6 mb-8">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" /> Curva de Visualizações ({daysFilter} dias)
        </h2>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="displayDate" stroke="#888" tick={{fill: '#888', fontSize: 12}} />
              <YAxis stroke="#888" tick={{fill: '#888', fontSize: 12}} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="views" name="Visualizações" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              <Area type="monotone" dataKey="clicks" name="Cliques" stroke="#3b82f6" strokeWidth={3} fillOpacity={0.2} fill="#3b82f6" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Referrers */}
        <div className="lg:col-span-2 bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/10 bg-zinc-800/50 flex items-center gap-2">
            <Globe className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-bold text-white">Top Origens de Tráfego</h2>
          </div>
          <div className="p-4">
            {topReferrers.length > 0 ? (
              <ul className="space-y-4">
                {topReferrers.map((ref, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <span className="text-zinc-300 font-medium truncate">{ref.name}</span>
                    <span className="bg-zinc-800 text-white text-xs px-2 py-1 rounded font-bold">{ref.count}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-zinc-500 text-center py-4">Dados insuficientes neste período.</p>
            )}
          </div>
        </div>

        {/* Devices */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/10 bg-zinc-800/50">
            <h2 className="text-lg font-bold text-white">Dispositivos</h2>
          </div>
          <div className="p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-white font-bold">Desktop</p>
                  <p className="text-xs text-zinc-500">Computadores</p>
                </div>
              </div>
              <span className="text-xl font-bold text-white">{devices.desktop}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-white font-bold">Mobile</p>
                  <p className="text-xs text-zinc-500">Telemóveis</p>
                </div>
              </div>
              <span className="text-xl font-bold text-white">{devices.mobile}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Posts Table */}
        <div className="bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-white/10 bg-zinc-800/50">
            <h2 className="text-lg font-bold text-white">Artigos Mais Lidos (Geral)</h2>
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
            <h2 className="text-lg font-bold text-white">Desempenho de Banners (Geral)</h2>
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
