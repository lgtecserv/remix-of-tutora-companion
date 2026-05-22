import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import { Bold, Italic, List, ListOrdered, Quote, Code, Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon, Youtube as YoutubeIcon, AlignLeft, AlignCenter, AlignRight, Undo, Redo } from "lucide-react";
import { useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function RichEditor({ value, onChange, placeholder = "Comece a escrever..." }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const fileRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "rounded-xl" } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
      Placeholder.configure({ placeholder }),
      Youtube.configure({ width: 640, height: 360, HTMLAttributes: { class: "rounded-xl" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4" },
    },
    immediatelyRender: false,
  });

  if (!editor) return <div className="min-h-[400px] rounded-md border border-input bg-background" />;

  async function uploadImage(file: File) {
    if (file.size > 5 * 1024 * 1024) return toast.error("Máx. 5 MB");
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
    editor!.chain().focus().setImage({ src: data.publicUrl }).run();
  }

  return (
    <div className="overflow-hidden rounded-md border border-input bg-background">
      <Toolbar editor={editor} onImageClick={() => fileRef.current?.click()} />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
      <EditorContent editor={editor} />
    </div>
  );
}

function Btn({ active, onClick, title, children }: any) {
  return (
    <button type="button" onClick={onClick} title={title} className={`rounded p-1.5 text-sm transition hover:bg-muted ${active ? "bg-primary/10 text-primary" : "text-secondary"}`}>
      {children}
    </button>
  );
}

function Toolbar({ editor, onImageClick }: { editor: Editor; onImageClick: () => void }) {
  function setLink() {
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL do link:", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run();
  }
  function setYoutube() {
    const url = window.prompt("URL do YouTube:");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url });
  }
  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 p-1.5">
      <Btn title="Desfazer" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Btn>
      <Btn title="Refazer" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Btn>
      <div className="mx-1 h-5 w-px bg-border" />
      <Btn title="Título 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-4 w-4" /></Btn>
      <Btn title="Título 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-4 w-4" /></Btn>
      <Btn title="Título 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="h-4 w-4" /></Btn>
      <div className="mx-1 h-5 w-px bg-border" />
      <Btn title="Negrito" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-4 w-4" /></Btn>
      <Btn title="Itálico" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-4 w-4" /></Btn>
      <div className="mx-1 h-5 w-px bg-border" />
      <Btn title="Lista" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-4 w-4" /></Btn>
      <Btn title="Lista numerada" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-4 w-4" /></Btn>
      <Btn title="Citação" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="h-4 w-4" /></Btn>
      <Btn title="Código" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="h-4 w-4" /></Btn>
      <div className="mx-1 h-5 w-px bg-border" />
      <Btn title="Esquerda" onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-4 w-4" /></Btn>
      <Btn title="Centro" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-4 w-4" /></Btn>
      <Btn title="Direita" onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-4 w-4" /></Btn>
      <div className="mx-1 h-5 w-px bg-border" />
      <Btn title="Link" active={editor.isActive("link")} onClick={setLink}><LinkIcon className="h-4 w-4" /></Btn>
      <Btn title="Imagem" onClick={onImageClick}><ImageIcon className="h-4 w-4" /></Btn>
      <Btn title="YouTube" onClick={setYoutube}><YoutubeIcon className="h-4 w-4" /></Btn>
    </div>
  );
}