## Objetivo

1. Formulário de cadastro de cursos completo (capa por upload, preço/gratuito, metadados ricos) e gestão de aulas com **preview do YouTube** em tempo real, sem `prompt()`.
2. Cursos publicados ficam **automaticamente visíveis** num catálogo público em `/app/catalogo`, e cursos **gratuitos auto-inscrevem** o aluno com 1 clique.
3. Player YouTube confiável (embed via IFrame API já existente — vamos endurecer + adicionar fallback iframe simples e validação visual no admin).
4. Página de blog profissional com **editor rich-text** (TipTap), upload de capa, slug editável, tags, agendamento, prévia.

---

## Fase 1 — Base de dados (migration)

Adicionar campos faltantes:

- `courses`:
  - `is_free boolean default false` (atalho de UI; preço fica em 0 quando true)
  - `short_description text` (subtítulo)
  - `what_you_learn text[]` (array de bullets)
  - `requirements text[]`
  - `target_audience text`
  - `tags text[]`
- `blog_posts`:
  - `tags text[]`
  - `reading_minutes int`
  - `scheduled_at timestamptz` (publicação agendada)

Storage buckets públicos:
- `course-covers` (capas de curso)
- `blog-covers` (capas de artigo)
- `blog-images` (imagens inline do editor)

Policies: leitura pública; escrita só para `admin` via `has_role`.

Trigger: quando um aluno tenta aceder a um curso `is_free = true`, criar `enrollment` automaticamente (alternativa: fazer no client com upsert — vamos pelo client para evitar complexidade de SECURITY DEFINER).

---

## Fase 2 — Admin: formulário de curso completo

Reescrever `admin.cursos.tsx` (lista) e `admin.cursos.$id.tsx` (edição) com:

**Aba "Detalhes"**
- Título, slug (editável, gerado por padrão), subtítulo, descrição longa
- Categoria, nível (select: Iniciante / Intermédio / Avançado), professor, duração
- **Toggle "Curso gratuito"** → quando ligado, esconde campo de preço e força `price_mzn = 0`
- Campo de preço (MZN) quando pago
- Capa: **upload para `course-covers`** com prévia, ou URL externo
- Tags (input com chips)
- O que vais aprender (lista dinâmica)
- Requisitos (lista dinâmica)
- Público-alvo
- Switch "Publicado" no topo

**Aba "Currículo"** (módulos e aulas)
- Modal próprio para criar/editar aula (substitui `prompt()`):
  - Título, descrição
  - URL do YouTube com **prévia ao vivo** (thumbnail + iframe pequeno) e validação do ID
  - Upload de anexo (material) para `course-covers` (ou bucket próprio se preferido)
  - Switch "Bloqueada"
- Reorder de módulos/aulas mantido

**Aba "SEO"**
- seo_title, seo_description, og_image (capa por padrão)

Validação com Zod antes de submeter.

---

## Fase 3 — Aluno: catálogo + inscrição automática

Nova rota `src/routes/app.catalogo.tsx`:
- Lista todos os cursos publicados (`is_published = true`) com filtros por categoria/nível/preço/gratuitos
- Cartão mostra preço ou badge "Grátis"
- Botão:
  - Curso gratuito → "Começar agora" → cria `enrollment` e redireciona para `/app/curso/$slug`
  - Curso pago → "Adquirir" → redireciona para `/app/checkout/$slug` (cria `payment` pendente)
- Item no sidebar do `/app` ("Catálogo")

`app.cursos.tsx` continua mostrando só os inscritos.

`app.curso.$slug.tsx`: se não inscrito mas curso é gratuito, mostrar botão "Inscrever-me gratuitamente" que faz o insert e recarrega.

---

## Fase 4 — Player YouTube robusto

Atual: usa IFrame API, dispara `onProgress` em 90% e desbloqueia próxima aula. Melhorias:

- Tratar `videoId` inválido com mensagem clara + link para admin reportar
- Suporte a URLs `youtu.be/`, `shorts/`, `watch?v=`, embeds e IDs puros (já parcialmente coberto em `youtube.ts` — vamos garantir)
- Salvar `percent` a cada 15 s mesmo antes dos 90 % (já faz por `% 10 === 0`, mas trocamos para throttle por tempo)
- Botão "Marcar como concluída" manual (caso o aluno termine mas a API perca contagem)
- Indicador de carregamento até `ytReady`
- No admin, ao colar URL, mostrar thumbnail (`hqdefault.jpg`) para confirmação visual

---

## Fase 5 — Blog profissional

Instalar TipTap:
```
@tiptap/react @tiptap/starter-kit @tiptap/extension-image
@tiptap/extension-link @tiptap/extension-placeholder
@tiptap/extension-youtube @tiptap/extension-text-align
```

Reescrever `admin.blog.tsx`:
- Lista com filtros (publicado/rascunho/agendado) e busca
- Editor em página dedicada (modal não cabe) com toolbar: H1/H2/H3, negrito, itálico, lista, citação, código, link, **imagem (upload para `blog-images`)**, **embed YouTube**, alinhamento
- Campos: título, slug auto-gerado mas editável, resumo, capa (upload), categoria, tags (chips), tempo de leitura (auto: ~200 palavras/min), SEO título/descrição
- Switches: publicado / agendar para data
- Botão "Pré-visualizar" abre artigo num drawer com o estilo final

`app.blog.tsx`:
- Renderiza o HTML do TipTap com `prose` do Tailwind (`@tailwindcss/typography` se ainda não estiver — adicionar)
- Filtros por tag + categoria, busca, paginação simples
- Página de artigo individual `/app/blog/$slug` com share, breadcrumbs e SEO no `head()`

`content` continua `text` mas armazena HTML do TipTap. Conteúdo antigo (texto puro) continua a renderizar com `whitespace-pre-wrap` fallback.

---

## Detalhes técnicos

- Upload: `supabase.storage.from('course-covers').upload(...)` no client com path `${userId}/${uuid}.${ext}`; policies permitem insert para admins.
- Auto-enrolment grátis: insert direto no client em `enrollments` — RLS atual exige admin write; precisamos **nova policy** "self-enroll free": `WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM courses c WHERE c.id = course_id AND c.is_free = true AND c.is_published = true))`.
- `@tailwindcss/typography` plugin para classes `prose`.
- Validações com `zod` em formulários de curso e artigo.

---

## Decisão prévia

Antes de implementar, confirme:

1. **Upload de capa**: criar buckets `course-covers` / `blog-covers` / `blog-images` agora? (recomendado)
2. **Auto-inscrição grátis**: adicionar a policy para o aluno se auto-inscrever em cursos grátis publicados? (necessário para o fluxo descrito)
3. **Editor de blog**: TipTap (rico, WYSIWYG) ou Markdown (mais simples)? Recomendo **TipTap**.

Diga "ok aprovado" ou ajuste pontos específicos antes de eu construir.
