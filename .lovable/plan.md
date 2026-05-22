# Plano: Painel Admin vs Painel Aluno — LMS Completa

Atualmente `/admin` e `/app` têm apenas placeholders (mesmos cards estáticos). Vou construir os dois painéis como áreas distintas, com rotas, dados reais (Supabase já tem o schema), e funcionalidades específicas de cada papel.

O schema do banco já suporta tudo: `courses`, `modules`, `lessons`, `enrollments`, `lesson_progress`, `comments`, `payments`, `blog_posts`, `profiles`, `user_roles`. Não precisa de migrations nesta primeira fase — só consumir o que existe.

Dado o tamanho, divido em **5 fases entregáveis**. Cada fase fica funcional e testável antes da próxima.

---

## Fase 1 — Reestruturação de rotas e layout (base)

Criar layouts separados com sidebar própria para cada painel:

```text
src/routes/
  _authenticated/                  (guard: requer login)
    app/                           (área do aluno)
      route.tsx                    layout aluno (sidebar: Dashboard, Meus Cursos, Blog, Perfil, Config)
      index.tsx                    dashboard aluno
      cursos.tsx                   meus cursos
      curso.$slug.tsx              player + lista de aulas + progresso
      blog.tsx
      perfil.tsx
      configuracoes.tsx
    admin/                         (guard adicional: requer role admin)
      route.tsx                    layout admin (sidebar: Dashboard, Cursos, Alunos, Comentários, Blog, Pagamentos, Config)
      index.tsx                    dashboard admin com KPIs
      cursos.index.tsx             listagem + CRUD
      cursos.$id.tsx               editar curso + módulos + aulas
      alunos.tsx
      comentarios.tsx
      blog.index.tsx
      blog.$id.tsx                 editor de artigo
      pagamentos.tsx
      configuracoes.tsx
```

Mover `/admin` e `/app` atuais para esta nova estrutura. Adicionar guard de role admin em `_authenticated/admin/route.tsx`.

## Fase 2 — Painel do Aluno (core)

- **Dashboard aluno**: "Continuar assistindo" (última aula com progresso < 100%), cursos em andamento, concluídos, recomendações (cursos publicados não inscritos).
- **Meus cursos**: lista de `enrollments` com barra de progresso (agregado de `lesson_progress`).
- **Player de aula** (`/app/curso/$slug`):
  - Embed YouTube (extrair ID do `youtube_url`)
  - Sidebar com módulos/aulas (aulas bloqueadas se anterior < 90%)
  - Tracking de progresso: ao atingir 90% → marcar `is_completed=true`, liberar próxima
  - Botões anterior/próxima
  - Materiais complementares (`attachment_url`)
  - Seção de comentários (insert/list em `comments`)
- **Blog**: listagem de `blog_posts` publicados + leitura individual + busca/categoria.
- **Perfil**: editar `profiles` (nome, foto via Supabase Storage).
- **Configurações**: trocar senha.

## Fase 3 — Painel Admin (gestão de conteúdo)

- **Dashboard admin com KPIs reais** (server function agregando):
  - Total de alunos (`profiles` count)
  - Novos alunos (últimos 30 dias)
  - Receita total/mensal (sum `payments` aprovados)
  - Cursos mais vendidos (group by em `payments`)
  - Cursos mais assistidos (group by em `lesson_progress`)
  - Taxa de conclusão, tempo médio
- **Gestão de cursos**: CRUD completo + duplicar + publicar/despublicar + upload de capa.
- **Gestão de módulos/aulas dentro do curso**:
  - Lista de módulos com drag-to-reorder (ou input de `position`)
  - Adicionar/editar/remover módulos
  - Dentro de cada módulo: aulas com link YouTube, anexos, lock/unlock
  - Sistema auto-incorpora YouTube (extrai ID de qualquer formato de URL)
- **Alunos**: lista com nome, email, cursos inscritos, progresso agregado, último acesso.
- **Comentários**: lista por aula, ocultar (`is_hidden=true`), responder (admin posta como comment vinculado).
- **Blog**: CRUD com editor de markdown/rich-text, campos SEO completos.

## Fase 4 — Pagamentos

- Tela de listagem de pagamentos com filtro por status.
- Aprovação manual (admin atualiza `status='approved'` → trigger já cria enrollment automaticamente).
- Aluno: tela de checkout no curso → escolhe método (M-Pesa, e-Mola, transferência) → cria payment `pending` com referência.
- Sem integração real de gateway nesta fase — só estrutura. Pagamento ficar "aguardando aprovação".

## Fase 5 — Configurações + polish

- Settings page admin (placeholder estruturado para SEO global, integrações).
- Settings aluno (senha, preferências).
- Página pública de catálogo de cursos (acessível sem login) + checkout.
- Refinamento visual, estados de loading/empty, validações zod em todos os forms.

---

## Detalhes técnicos

- **Server functions** (`createServerFn` + `requireSupabaseAuth`) para todas as queries protegidas (dashboards, mutations admin). RLS já existe como backstop.
- **TanStack Query** para cache (loader + `useSuspenseQuery`).
- **Player YouTube**: regex para extrair ID, `<iframe>` com YouTube IFrame API para tracking de progresso real (evento `onStateChange` + `getCurrentTime/getDuration`).
- **Reorder de módulos/aulas**: input numérico de posição na fase 3; drag-and-drop opcional depois.
- **Upload de capas**: criar bucket `course-covers` no Supabase Storage (migration na fase 3).
- **Comentários do admin**: usar mesmo `comments` table — UI distingue pelo `user_roles` do autor.

## Recomendação

Aprovar e começar pela **Fase 1 + 2** (reestrutura + painel do aluno funcional ponta a ponta com 1 curso de teste). Isso já entrega valor visível: dá pra logar como aluno, ver curso, assistir aula, progredir. Depois passamos pra Fase 3 (admin real).

Quer que eu comece pela Fase 1+2, ou prefere outra ordem (ex: começar pelo admin para você cadastrar cursos primeiro)?
