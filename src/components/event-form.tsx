"use client"

import { useActionState } from "react"

import { createEvent, updateEvent, type EventFormState } from "@/app/events/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function EventForm({
  event,
}: {
  event?: {
    id: string
    title: string
    startsAtLocal: string
    capacity: number
  }
}) {
  const action = event ? updateEvent : createEvent
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(action, null)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={event?.title} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="startsAt">Starts</Label>
        <Input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          defaultValue={event?.startsAtLocal}
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="capacity">Capacity</Label>
        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={1}
          step={1}
          defaultValue={event?.capacity ?? 100}
          required
        />
      </div>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : event ? "Save event" : "Create event"}
      </Button>
    </form>
  )
}
