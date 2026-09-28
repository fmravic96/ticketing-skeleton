alter table public.events
  add column description text,
  add column venue text,
  add column ends_at timestamptz,
  add column status text not null default 'draft';

alter table public.events
  add constraint events_status_check check (status in ('draft', 'published')),
  add constraint events_ends_after_start check (ends_at is null or ends_at > starts_at);

create table public.ticket_types (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  price_cents integer not null check (price_cents >= 0),
  quantity integer not null check (quantity > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index ticket_types_event_id_idx on public.ticket_types (event_id);

alter table public.ticket_types enable row level security;

create policy "ticket_types_select_org"
  on public.ticket_types
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.events
      where events.id = ticket_types.event_id
        and public.is_org_member(events.organization_id)
    )
  );

grant select on public.ticket_types to authenticated;
revoke insert, update on public.events from authenticated;

create function public.save_event(
  event_id uuid,
  org_id uuid,
  event_title text,
  event_description text,
  event_venue text,
  event_starts_at timestamptz,
  event_ends_at timestamptz,
  event_capacity integer,
  event_status text,
  tickets jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  saved_id uuid := event_id;
  ticket jsonb;
  ticket_name text;
  ticket_price integer;
  ticket_qty integer;
  total_qty integer := 0;
  ticket_count integer := 0;
  clean_description text := nullif(trim(event_description), '');
  clean_venue text := nullif(trim(event_venue), '');
begin
  if auth.uid() is null or not public.is_org_member(org_id) then
    raise exception 'Not a member of this organization';
  end if;
  if event_status not in ('draft', 'published') then
    raise exception 'Status must be draft or published';
  end if;
  if char_length(trim(event_title)) < 1 then
    raise exception 'Title is required';
  end if;
  if event_capacity < 1 then
    raise exception 'Capacity must be a whole number greater than zero';
  end if;
  if event_ends_at is not null and event_ends_at <= event_starts_at then
    raise exception 'End time must be after the start time';
  end if;
  if jsonb_typeof(tickets) is distinct from 'array' then
    raise exception 'Tickets must be a list';
  end if;

  if saved_id is null then
    insert into public.events (
      organization_id, title, description, venue, starts_at, ends_at, capacity, status
    )
    values (
      org_id, trim(event_title), clean_description, clean_venue,
      event_starts_at, event_ends_at, event_capacity, event_status
    )
    returning id into saved_id;
  else
    update public.events
    set
      title = trim(event_title),
      description = clean_description,
      venue = clean_venue,
      starts_at = event_starts_at,
      ends_at = event_ends_at,
      capacity = event_capacity,
      status = event_status
    where id = saved_id
      and organization_id = org_id;
    if not found then
      raise exception 'Event not found';
    end if;
  end if;

  delete from public.ticket_types as ticket_row
  where ticket_row.event_id = saved_id;

  for ticket in
    select value from jsonb_array_elements(tickets)
  loop
    ticket_name := trim(ticket ->> 'name');
    ticket_price := (ticket ->> 'price_cents')::integer;
    ticket_qty := (ticket ->> 'quantity')::integer;
    if ticket_name = '' or ticket_price is null or ticket_price < 0 or ticket_qty is null or ticket_qty < 1 then
      raise exception 'Each ticket type needs a name, a price, and a quantity';
    end if;
    insert into public.ticket_types (event_id, name, price_cents, quantity, sort_order)
    values (saved_id, ticket_name, ticket_price, ticket_qty, ticket_count);
    total_qty := total_qty + ticket_qty;
    ticket_count := ticket_count + 1;
  end loop;

  if total_qty > event_capacity then
    raise exception 'Ticket quantities are over the event capacity';
  end if;
  if event_status = 'published' and ticket_count = 0 then
    raise exception 'A published event needs at least one ticket type';
  end if;

  return saved_id;
end;
$$;

revoke all on function public.save_event(uuid, uuid, text, text, text, timestamptz, timestamptz, integer, text, jsonb) from public;
grant execute on function public.save_event(uuid, uuid, text, text, text, timestamptz, timestamptz, integer, text, jsonb) to authenticated;
