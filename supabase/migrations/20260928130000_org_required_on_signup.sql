create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org_name text := nullif(trim(new.raw_user_meta_data ->> 'organization_name'), '');
  base text;
  candidate text;
  suffix int := 0;
  new_org uuid;
begin
  if org_name is null or char_length(org_name) < 2 then
    raise exception 'Organization name is required';
  end if;

  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(new.email, '@', 1)
    ),
    new.email
  );

  base := public.slugify(org_name);
  candidate := base;
  while exists (select 1 from public.organizations where slug = candidate) loop
    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  end loop;

  insert into public.organizations (name, slug)
  values (org_name, candidate)
  returning id into new_org;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org, new.id, 'owner');

  insert into public.organization_members (organization_id, user_id, role)
  select invite.organization_id, new.id, invite.role
  from public.organization_invites as invite
  where lower(invite.email) = lower(new.email)
    and invite.organization_id <> new_org;

  delete from public.organization_invites
  where lower(email) = lower(new.email);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
