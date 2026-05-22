
create type public.app_role as enum ('admin', 'aluno');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "user_roles self read" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "user_roles admin write" on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, avatar_url text, bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles self insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create trigger profiles_updated_at before update on public.profiles for each row execute function public.tg_set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'aluno') on conflict do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title text not null, description text, cover_url text,
  category text, instructor text, level text,
  duration_minutes int default 0, price_mzn numeric(10,2) default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.courses enable row level security;
create trigger courses_updated_at before update on public.courses for each row execute function public.tg_set_updated_at();
create policy "courses public read published" on public.courses for select using (is_published or public.has_role(auth.uid(),'admin'));
create policy "courses admin write" on public.courses for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade not null,
  title text not null, position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.modules enable row level security;
create policy "modules read with course" on public.modules for select
  using (exists (select 1 from public.courses c where c.id = course_id and (c.is_published or public.has_role(auth.uid(),'admin'))));
create policy "modules admin write" on public.modules for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
alter table public.enrollments enable row level security;
create policy "enrollments self read" on public.enrollments for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "enrollments admin write" on public.enrollments for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid references public.modules(id) on delete cascade not null,
  title text not null, description text, youtube_url text, attachment_url text,
  position int not null default 0, is_locked boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.lessons enable row level security;
create policy "lessons read enrolled or admin" on public.lessons for select using (
  public.has_role(auth.uid(),'admin') or exists (
    select 1 from public.modules m join public.enrollments e on e.course_id = m.course_id
    where m.id = module_id and e.user_id = auth.uid()
  )
);
create policy "lessons admin write" on public.lessons for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  percent numeric(5,2) not null default 0,
  is_completed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
alter table public.lesson_progress enable row level security;
create trigger lesson_progress_updated_at before update on public.lesson_progress for each row execute function public.tg_set_updated_at();
create policy "progress self read" on public.lesson_progress for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "progress self insert" on public.lesson_progress for insert to authenticated with check (user_id = auth.uid());
create policy "progress self update" on public.lesson_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null, is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
create policy "comments read for enrolled" on public.comments for select using (
  (not is_hidden or public.has_role(auth.uid(),'admin')) and (
    public.has_role(auth.uid(),'admin') or exists (
      select 1 from public.lessons l join public.modules m on m.id = l.module_id
      join public.enrollments e on e.course_id = m.course_id
      where l.id = lesson_id and e.user_id = auth.uid()
    )
  )
);
create policy "comments self insert" on public.comments for insert to authenticated with check (user_id = auth.uid());
create policy "comments admin update" on public.comments for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
create policy "comments self or admin delete" on public.comments for delete to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null, title text not null, excerpt text, content text,
  cover_url text, category text, seo_title text, seo_description text,
  is_published boolean not null default false,
  author_id uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.blog_posts enable row level security;
create trigger blog_posts_updated_at before update on public.blog_posts for each row execute function public.tg_set_updated_at();
create policy "blog public read published" on public.blog_posts for select using (is_published or public.has_role(auth.uid(),'admin'));
create policy "blog admin write" on public.blog_posts for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create type public.payment_method as enum ('mpesa','emola','transferencia');
create type public.payment_status as enum ('pending','approved','rejected');

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  course_id uuid references public.courses(id) on delete cascade not null,
  amount_mzn numeric(10,2) not null,
  method public.payment_method not null,
  reference text,
  status public.payment_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.payments enable row level security;
create trigger payments_updated_at before update on public.payments for each row execute function public.tg_set_updated_at();
create policy "payments self read" on public.payments for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "payments self insert" on public.payments for insert to authenticated with check (user_id = auth.uid() and status = 'pending');
create policy "payments admin update" on public.payments for update to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_payment_approval()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is null or old.status <> 'approved') then
    insert into public.enrollments (user_id, course_id) values (new.user_id, new.course_id) on conflict do nothing;
  end if;
  return new;
end; $$;
create trigger payments_on_approval after update on public.payments for each row execute function public.handle_payment_approval();
