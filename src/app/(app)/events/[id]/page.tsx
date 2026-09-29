import { notFound } from "next/navigation"

import { deleteEvent } from "@/app/events/actions"
import { EventForm } from "@/components/event-form"
import { Button } from "@/components/ui/button"
import { toDatetimeLocalValue } from "@/lib/datetime"
import { centsToEurosInput } from "@/lib/events"
import { eventImageUrl } from "@/lib/images"
import { requireCurrentOrg } from "@/lib/org"
import { createClient } from "@/lib/supabase/server"

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { org } = await requireCurrentOrg()
  const supabase = await createClient()
  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, venue, starts_at, ends_at, capacity, status, image_path")
    .eq("id", id)
    .eq("organization_id", org.id)
    .maybeSingle()

  if (!event) notFound()

  const { data: tickets } = await supabase
    .from("ticket_types")
    .select("name, price_cents, quantity")
    .eq("event_id", event.id)
    .order("sort_order", { ascending: true })

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Edit event</h1>
        <p className="text-sm text-muted-foreground">{event.title}</p>
      </div>
      <EventForm
        event={{
          id: event.id,
          title: event.title,
          description: event.description ?? "",
          venue: event.venue ?? "",
          startsAtLocal: toDatetimeLocalValue(event.starts_at),
          endsAtLocal: event.ends_at ? toDatetimeLocalValue(event.ends_at) : "",
          capacity: event.capacity,
          status: event.status,
          tickets: (tickets ?? []).map((ticket) => ({
            name: ticket.name,
            price: centsToEurosInput(ticket.price_cents),
            quantity: String(ticket.quantity),
          })),
          imageUrl: eventImageUrl(event.image_path),
        }}
      />
      <form action={deleteEvent}>
        <input type="hidden" name="id" value={event.id} />
        <Button type="submit" variant="destructive">
          Delete event
        </Button>
      </form>
    </div>
  )
}
