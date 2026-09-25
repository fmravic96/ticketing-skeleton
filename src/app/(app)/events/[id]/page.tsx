import { notFound } from "next/navigation"

import { deleteEvent } from "@/app/events/actions"
import { EventForm } from "@/components/event-form"
import { Button } from "@/components/ui/button"
import { toDatetimeLocalValue } from "@/lib/datetime"
import { createClient } from "@/lib/supabase/server"

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: event } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity")
    .eq("id", id)
    .maybeSingle()

  if (!event) notFound()

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Edit event</h1>
        <p className="text-sm text-muted-foreground">{event.title}</p>
      </div>
      <EventForm
        event={{
          id: event.id,
          title: event.title,
          startsAtLocal: toDatetimeLocalValue(event.starts_at),
          capacity: event.capacity,
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
