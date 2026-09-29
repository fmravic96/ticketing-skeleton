alter table public.events
  add column image_path text;

alter table public.events
  add constraint events_image_path_check check (
    image_path is null
    or image_path ~ ('^' || organization_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$')
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
);

create policy "event_images_public_read"
  on storage.objects
  for select
  to public
  using (bucket_id = 'event-images');

create policy "event_images_member_insert"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'event-images'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
    and (storage.foldername(name))[2] is null
  );

create policy "event_images_member_delete"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'event-images'
    and public.is_org_member(((storage.foldername(name))[1])::uuid)
  );

drop function public.save_event(uuid, uuid, text, text, text, timestamptz, timestamptz, integer, text, jsonb);

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
  tickets jsonb,
  event_image_path text
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
  clean_image text := nullif(trim(event_image_path), '');
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
  if clean_image is not null and clean_image !~ (
    '^' || org_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$'
  ) then
    raise exception 'Image path is not valid';
  end if;

  if saved_id is null then
    insert into public.events (
      organization_id, title, description, venue, starts_at, ends_at, capacity, status, image_path
    )
    values (
      org_id, trim(event_title), clean_description, clean_venue,
      event_starts_at, event_ends_at, event_capacity, event_status, clean_image
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
      status = event_status,
      image_path = clean_image
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

revoke all on function public.save_event(uuid, uuid, text, text, text, timestamptz, timestamptz, integer, text, jsonb, text) from public;
grant execute on function public.save_event(uuid, uuid, text, text, text, timestamptz, timestamptz, integer, text, jsonb, text) to authenticated;
