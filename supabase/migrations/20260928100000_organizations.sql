alter table public.profiles
  add column email text;

update public.profiles as profile
set email = users.email
from auth.users as users
where users.id = profile.id;

revoke update on public.profiles from authenticated;
grant update (display_name, updated_at) on public.profiles to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  constraint organizations_name_length check (char_length(trim(name)) >= 2)
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  invited_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create unique index organization_invites_org_email
  on public.organization_invites (organization_id, lower(email));

alter table public.events
  add column organization_id uuid references public.organizations (id) on delete cascade;

insert into public.organizations (name, slug)
select
  'My organization',
  'org-' || replace(owner.owner_id::text, '-', '')
from (
  select distinct owner_id from public.events
) as owner;

insert into public.organization_members (organization_id, user_id, role)
select organization.id, owner.owner_id, 'owner'
from (
  select distinct owner_id from public.events
) as owner
join public.organizations as organization
  on organization.slug = 'org-' || replace(owner.owner_id::text, '-', '');

update public.events as event
set organization_id = organization.id
from public.organizations as organization
where organization.slug = 'org-' || replace(event.owner_id::text, '-', '');

alter table public.organization_members
  add constraint organization_members_profile_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

drop policy "events_select_own" on public.events;
drop policy "events_insert_own" on public.events;
drop policy "events_update_own" on public.events;
drop policy "events_delete_own" on public.events;

alter table public.events
  drop column owner_id;

alter table public.events
  alter column organization_id set not null;

create index events_organization_id_idx on public.events (organization_id);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;

create function public.slugify(value text)
returns text
language sql
immutable
as $$
  select coalesce(
    nullif(
      trim(both '-' from regexp_replace(lower(trim(value)), '[^a-z0-9]+', '-', 'g')),
      ''
    ),
    'org'
  );
$$;

create function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members
    where organization_id = org_id
      and user_id = auth.uid()
  );
$$;

create function public.current_org_role(org_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.organization_members
  where organization_id = org_id
    and user_id = auth.uid();
$$;

create function public.create_organization(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  base text;
  candidate text;
  suffix int := 0;
  new_id uuid;
begin
  if actor is null then
    raise exception 'Not authenticated';
  end if;
  if char_length(trim(org_name)) < 2 then
    raise exception 'Organization name is too short';
  end if;

  base := public.slugify(org_name);
  candidate := base;
  while exists (select 1 from public.organizations where slug = candidate) loop
    suffix := suffix + 1;
    candidate := base || '-' || suffix::text;
  end loop;

  insert into public.organizations (name, slug)
  values (trim(org_name), candidate)
  returning id into new_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_id, actor, 'owner');

  return new_id;
end;
$$;

create function public.invite_member(org_id uuid, member_email text, member_role text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  actor_role text := public.current_org_role(org_id);
  normalized_email text := lower(trim(member_email));
  existing_user uuid;
begin
  if actor is null or actor_role is null then
    raise exception 'Not a member of this organization';
  end if;
  if member_role not in ('admin', 'member') then
    raise exception 'Role must be admin or member';
  end if;
  if actor_role = 'member' or (actor_role = 'admin' and member_role <> 'member') then
    raise exception 'You cannot invite someone with that role';
  end if;
  if normalized_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Enter a valid email';
  end if;

  select id into existing_user
  from auth.users
  where lower(email) = normalized_email;

  if existing_user is not null then
    insert into public.organization_members (organization_id, user_id, role)
    values (org_id, existing_user, member_role)
    on conflict (organization_id, user_id) do nothing;
    if not found then
      raise exception 'That person is already a member';
    end if;
    delete from public.organization_invites
    where organization_id = org_id
      and lower(email) = normalized_email;
    return 'added';
  end if;

  insert into public.organization_invites (organization_id, email, role, invited_by)
  values (org_id, normalized_email, member_role, actor)
  on conflict (organization_id, lower(email)) do update
    set role = excluded.role,
        invited_by = excluded.invited_by;
  return 'invited';
end;
$$;

create function public.set_member_role(org_id uuid, member_id uuid, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text := public.current_org_role(org_id);
  target_role text;
begin
  if new_role not in ('admin', 'member') then
    raise exception 'Role must be admin or member';
  end if;

  select role into target_role
  from public.organization_members
  where organization_id = org_id
    and user_id = member_id;

  if target_role is null then
    raise exception 'Member not found';
  end if;
  if target_role = 'owner' then
    raise exception 'The owner role cannot be changed here';
  end if;
  if actor_role = 'owner' then
    null;
  elsif actor_role = 'admin' and target_role = 'member' and new_role = 'member' then
    null;
  else
    raise exception 'You cannot change that role';
  end if;

  update public.organization_members
  set role = new_role
  where organization_id = org_id
    and user_id = member_id;
end;
$$;

create function public.remove_member(org_id uuid, member_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text := public.current_org_role(org_id);
  target_role text;
  owner_count int;
begin
  select role into target_role
  from public.organization_members
  where organization_id = org_id
    and user_id = member_id;

  if target_role is null then
    raise exception 'Member not found';
  end if;
  if actor_role is null or actor_role = 'member' then
    raise exception 'You cannot remove members';
  end if;
  if actor_role = 'admin' and target_role <> 'member' then
    raise exception 'Admins can only remove members';
  end if;

  if target_role = 'owner' then
    select count(*) into owner_count
    from public.organization_members
    where organization_id = org_id
      and role = 'owner';
    if owner_count < 2 then
      raise exception 'The organization needs an owner';
    end if;
  end if;

  delete from public.organization_members
  where organization_id = org_id
    and user_id = member_id;
end;
$$;

create function public.revoke_invite(invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org_id uuid;
  actor_role text;
begin
  select organization_id into org_id
  from public.organization_invites
  where id = invite_id;

  if org_id is null then
    raise exception 'Invite not found';
  end if;

  actor_role := public.current_org_role(org_id);
  if actor_role not in ('owner', 'admin') then
    raise exception 'You cannot revoke invites';
  end if;

  delete from public.organization_invites where id = invite_id;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    ),
    new.email
  );

  insert into public.organization_members (organization_id, user_id, role)
  select invite.organization_id, new.id, invite.role
  from public.organization_invites as invite
  where lower(invite.email) = lower(new.email);

  delete from public.organization_invites
  where lower(email) = lower(new.email);

  return new;
end;
$$;

create policy "organizations_select_member"
  on public.organizations
  for select
  to authenticated
  using (public.is_org_member(id));

create policy "organizations_update_manager"
  on public.organizations
  for update
  to authenticated
  using (public.current_org_role(id) in ('owner', 'admin'))
  with check (public.current_org_role(id) in ('owner', 'admin'));

create policy "organizations_delete_owner"
  on public.organizations
  for delete
  to authenticated
  using (public.current_org_role(id) = 'owner');

create policy "organization_members_select"
  on public.organization_members
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "organization_invites_select"
  on public.organization_invites
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "events_select_org"
  on public.events
  for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "events_insert_org"
  on public.events
  for insert
  to authenticated
  with check (public.is_org_member(organization_id));

create policy "events_update_org"
  on public.events
  for update
  to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy "events_delete_org"
  on public.events
  for delete
  to authenticated
  using (public.is_org_member(organization_id));

grant select, update, delete on public.organizations to authenticated;
grant select on public.organization_members to authenticated;
grant select on public.organization_invites to authenticated;

revoke all on function public.slugify(text) from public;
revoke all on function public.is_org_member(uuid) from public;
revoke all on function public.current_org_role(uuid) from public;
revoke all on function public.create_organization(text) from public;
revoke all on function public.invite_member(uuid, text, text) from public;
revoke all on function public.set_member_role(uuid, uuid, text) from public;
revoke all on function public.remove_member(uuid, uuid) from public;
revoke all on function public.revoke_invite(uuid) from public;
revoke all on function public.handle_new_user() from public;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.current_org_role(uuid) to authenticated;
grant execute on function public.create_organization(text) to authenticated;
grant execute on function public.invite_member(uuid, text, text) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.revoke_invite(uuid) to authenticated;
