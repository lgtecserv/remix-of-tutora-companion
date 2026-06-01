import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://www.imersaocompleta.info";

export const Route = createFileRoute("/rss.xml")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { data: posts, error } = await supabase
            .from("blog_posts")
            .select("*")
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(50); // RSS feeds usually show the latest 50 posts

          if (error) console.error("Erro RSS:", error);

          const items = (posts || []).map((post) => {
            const date = new Date(post.published_at || post.created_at).toUTCString();
            const url = `${BASE_URL}/blog/${post.slug}`;
            const description = post.excerpt || post.llm_summary || "";
            // Escape special XML characters
            const safeTitle = post.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeDesc = description.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            return `
    <item>
      <title>${safeTitle}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${date}</pubDate>
      <description>${safeDesc}</description>
      ${post.category ? `<category>${post.category.replace(/&/g, '&amp;')}</category>` : ''}
    </item>`;
          }).join("");

          const xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Imersão Completa - Blog</title>
    <link>${BASE_URL}/blog</link>
    <description>Aprenda IA, desenvolvimento web, apps e negócios digitais com a Imersão Completa.</description>
    <language>pt-pt</language>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

          return new Response(xml, {
            headers: {
              "Content-Type": "application/xml; charset=utf-8",
              "Cache-Control": "public, max-age=3600, s-maxage=18000"
            }
          });
        } catch (err) {
          console.error("Erro fatal ao gerar RSS:", err);
          return new Response("Error generating RSS feed", { status: 500 });
        }
      }
    }
  }
});
