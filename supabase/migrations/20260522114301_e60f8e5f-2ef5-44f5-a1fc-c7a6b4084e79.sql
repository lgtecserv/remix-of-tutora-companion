
create extension if not exists pgcrypto;

do $$
declare
  v_admin_id uuid := '00000000-0000-0000-0000-00000000a001';
  v_aluno_id uuid := '00000000-0000-0000-0000-00000000a002';
begin
  -- Admin
  if not exists (select 1 from auth.users where email = 'admin@imersaocompleta.test') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_admin_id, 'authenticated', 'authenticated',
      'admin@imersaocompleta.test', crypt('Admin@1234', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Administrador"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_admin_id,
      jsonb_build_object('sub', v_admin_id::text, 'email', 'admin@imersaocompleta.test'),
      'email', v_admin_id::text, now(), now(), now());
  end if;

  -- Aluno
  if not exists (select 1 from auth.users where email = 'aluno@imersaocompleta.test') then
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token,
      email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_aluno_id, 'authenticated', 'authenticated',
      'aluno@imersaocompleta.test', crypt('Aluno@1234', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Aluno Teste"}'::jsonb,
      now(), now(), '', '', '', ''
    );
    insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    values (gen_random_uuid(), v_aluno_id,
      jsonb_build_object('sub', v_aluno_id::text, 'email', 'aluno@imersaocompleta.test'),
      'email', v_aluno_id::text, now(), now(), now());
  end if;

  -- Garantir profile + role (caso o trigger não tenha disparado)
  insert into public.profiles (id, full_name) values
    (v_admin_id, 'Administrador'),
    (v_aluno_id, 'Aluno Teste')
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values
    (v_admin_id, 'aluno'),
    (v_admin_id, 'admin'),
    (v_aluno_id, 'aluno')
  on conflict do nothing;
end $$;
