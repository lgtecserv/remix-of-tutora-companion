import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

export function TagInput({ value, onChange, placeholder = "Adicionar e Enter" }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [text, setText] = useState("");
  function add() {
    const t = text.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]); setText("");
  }
  function key(e: KeyboardEvent) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
    if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
  }
  return (
    <div className="rounded-md border border-input bg-background p-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
          </span>
        ))}
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={key} onBlur={add} placeholder={placeholder} className="h-7 flex-1 border-0 px-1 shadow-none focus-visible:ring-0" />
      </div>
    </div>
  );
}