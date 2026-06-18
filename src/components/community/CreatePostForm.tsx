import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Send, X, Hash, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreatePostForm() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("Geral");
  const [courseId, setCourseId] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const CATEGORIES = ["Geral", "Dúvidas", "Projetos", "Dicas", "Off-Topic"];

  const { data: courses } = useQuery({
    queryKey: ['courses_list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('id, title').eq('is_published', true);
      if (error) throw error;
      return data;
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2MB.");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const createPostMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('community_images')
          .upload(filePath, imageFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('community_images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      const { error } = await supabase.from('community_posts').insert({
        user_id: user.id,
        content: content.trim(),
        image_url: imageUrl,
        category: category,
        course_id: courseId || null
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      setCategory("Geral");
      setCourseId("");
      removeImage();
      queryClient.invalidateQueries({ queryKey: ['community_posts'] });
      toast.success("Postagem publicada!");
    },
    onError: (error) => {
      toast.error("Erro ao publicar postagem.");
      console.error(error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) return;
    createPostMutation.mutate();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          placeholder="O que você está pensando ou estudando hoje?"
          className="w-full bg-transparent border-none resize-none focus:ring-0 text-foreground placeholder:text-muted-foreground min-h-[80px]"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        {imagePreview && (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="max-h-48 rounded-lg object-cover" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <label className="cursor-pointer text-muted-foreground hover:text-primary transition flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted">
            <ImageIcon className="w-5 h-5" />
            <span className="hidden sm:inline text-sm font-medium">Imagem</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
            />
          </label>

          <div className="flex items-center gap-2 border-l border-border pl-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="text-sm bg-transparent border-none text-muted-foreground focus:ring-0 cursor-pointer outline-none max-w-[100px] truncate"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="text-sm bg-transparent border-none text-muted-foreground focus:ring-0 cursor-pointer outline-none max-w-[120px] truncate"
            >
              <option value="">Nenhum curso</option>
              {courses?.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>
          
          <Button 
            type="submit" 
            disabled={(!content.trim() && !imageFile) || createPostMutation.isPending}
            className="rounded-full px-6"
          >
            {createPostMutation.isPending ? "Enviando..." : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Publicar
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
