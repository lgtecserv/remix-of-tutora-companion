import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          console.log("Upload endpoint: starting formData parsing");
          const formData = await request.formData();
          const file = formData.get("file") as File | null;
          const bucket = formData.get("bucket") as string | null;
          const path = formData.get("path") as string | null;

          console.log("Upload request parameters:", {
            hasFile: !!file,
            fileName: file?.name,
            fileType: file?.type,
            fileSize: file?.size,
            bucket,
            path
          });

          console.log("Supabase config status:", {
            hasUrl: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
            hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
          });

          if (!file || !bucket || !path) {
            return new Response(JSON.stringify({ error: "Parâmetros incompletos" }), { 
              status: 400,
              headers: { "Content-Type": "application/json" }
            });
          }

          const buffer = await file.arrayBuffer();

          const { data, error } = await supabaseAdmin.storage
            .from(bucket)
            .upload(path, buffer, {
              contentType: file.type || "application/octet-stream",
              upsert: true,
            });

          if (error) {
            console.error("Supabase storage error:", error);
            return new Response(JSON.stringify({ error: error.message }), { 
              status: 500,
              headers: { "Content-Type": "application/json" }
            });
          }

          const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);

          return new Response(JSON.stringify({ 
            success: true, 
            path: data.path,
            publicUrl: publicUrlData.publicUrl 
          }), { status: 200, headers: { "Content-Type": "application/json" } });
        } catch (err: any) {
          console.error("UPLOAD EXCEPTION:", err);
          return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { 
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
      },
    },
  },
});
