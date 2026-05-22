# Ajustes visuais + Contas de teste

## 1. Logotipo — dar destaque e corrigir visibilidade

**Problema:** o logo tem partes brancas (texto "completa") que somem sobre o fundo branco do header, e está pequeno demais.

**Solução:**
- Envolver o logo num "pill" de fundo escuro (`bg-secondary`, o azul-marinho da paleta) com padding e cantos arredondados, para que as letras brancas fiquem sempre legíveis em qualquer secção.
- Aumentar de `h-10` para `h-12` no header e `h-14` no footer.
- No footer remover o `brightness-0 invert` (que estraga o azul do símbolo) e usar a mesma pill escura.
- Adicionar um leve `drop-shadow` para dar presença.

## 2. Hero — harmonia entre a foto e o fundo

**Problema:** a foto do fundador tem fundo preto sólido; o hero é azul-royal. Choque visual no limite da imagem.

**Solução (sem reeditar a foto):**
- Trocar o gradient do hero por um degradê que **começa em azul-royal e termina em preto profundo** no lado onde a foto fica (`linear-gradient(110deg, primary-deep 0%, secondary 60%, #000 100%)`), fazendo a foto "derreter" no fundo.
- Adicionar um **vignette radial preto** atrás da foto (em vez do glow azul atual) para fundir as bordas.
- Aplicar uma `mask-image` radial suave na própria `<img>` (fade nas bordas) — fica como se a foto saísse do fundo.
- Moldura mais discreta: borda preta translúcida em vez de branca, sombra preta longa.
- Manter o lado do texto com o azul vibrante para preservar a identidade da marca.

## 3. Contas de teste (admin e aluno)

Criar via migração SQL dois utilizadores prontos a usar:

| Papel  | Email                       | Password      |
|--------|-----------------------------|---------------|
| Admin  | admin@imersaocompleta.test  | Admin@1234    |
| Aluno  | aluno@imersaocompleta.test  | Aluno@1234    |

- Inserir em `auth.users` com password já encriptada (`crypt(..., gen_salt('bf'))`) e `email_confirmed_at = now()` para login imediato.
- O trigger `handle_new_user` já cria `profiles` + papel `aluno` automaticamente.
- Para o admin, inserir adicionalmente em `public.user_roles` o papel `admin`.
- Depois de logar:
  - Aluno → `/app`
  - Admin → `/admin`

## Detalhes técnicos

- Ficheiros a alterar: `src/routes/index.tsx` (Logo, Header, Hero, Footer), `src/styles.css` (novo `--gradient-hero`, nova var `--vignette-hero`).
- Nova migração SQL para os utilizadores de teste (uso de `gen_salt('bf')` da extensão `pgcrypto`, já disponível no Supabase).
- Nenhuma alteração ao schema nem às RLS.
