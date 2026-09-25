import Link from "next/link"

import { Button } from "@/components/ui/button"
import { formatEventStart } from "@/lib/datetime"
import { createClient } from "@/lib/supabase/server"

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at, capacity")
    .order("starts_at", { ascending: true })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">Events owned by this account.</p>
        </div>
        <Button nativeButton={false} render={<Link href="/events/new" />}>
          New event
        </Button>
      </div>
      {events?.length ? (
        <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/events/${event.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted/60"
              >
                <span>
                  <span className="block font-medium">{event.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatEventStart(event.starts_at)}
                  </span>
                </span>
                <span className="text-sm text-muted-foreground">{event.capacity} seats</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl px-4 py-8 text-sm text-muted-foreground ring-1 ring-foreground/10">
          No events yet.
        </p>
      )}
    </div>
  )
}
