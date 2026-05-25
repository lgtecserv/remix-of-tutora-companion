import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// URL base da plataforma
const BASE_URL = "https://tutora-companion.lovable.app"; // URL padrão de produção

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const paths = ["/", "/login", "/registo"];

        try {
          // 1. Buscar posts de blog publicados dinamicamente
          const { data: posts } = await supabaseAdmin
            .from("blog_posts")
            .select("slug")
            .eq("is_published", true);

          if (posts) {
            posts.forEach(post => {
              paths.push(`/app/blog/${post.slug}`);
            });
          }

          // 2. Buscar cursos publicados dinamicamente
          const { data: courses } = await supabaseAdmin
            .from("courses")
            .select("slug")
            .eq("is_published", true);

          if (courses) {
            courses.forEach(course => {
              paths.push(`/app/curso/${course.slug}`);
            });
          }
        } catch (error) {
          console.error("Erro ao gerar sitemap dinâmico:", error);
        }

        const urls = paths
          .map((p) => `  <url>\n    <loc>${BASE_URL}${p}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${p === "/" ? "1.0" : "0.8"}</priority>\n  </url>`)
          .join("\n");

        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;
        
        return new Response(xml, { 
          headers: { 
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600, s-maxage=18000" // Cache otimizado para motores de busca
          } 
        });
      },
    },
  },
});