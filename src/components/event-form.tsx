"use client"

import { useState } from "react"
import { useActionState } from "react"

import { createEvent, updateEvent, type EventFormState } from "@/app/events/actions"
import { Field, FormNote, Select, Textarea } from "@/components/form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EventStatus, TicketFormValue } from "@/lib/events"

const emptyTicket = (): TicketFormValue => ({ name: "", price: "", quantity: "" })

export function EventForm({
  event,
}: {
  event?: {
    id: string
    title: string
    description: string
    venue: string
    startsAtLocal: string
    endsAtLocal: string
    capacity: number
    status: EventStatus
    tickets: TicketFormValue[]
  }
}) {
  const action = event ? updateEvent : createEvent
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(action, null)
  const [tickets, setTickets] = useState<TicketFormValue[]>(
    event?.tickets.length ? event.tickets : [emptyTicket()],
  )

  function updateTicket(index: number, patch: Partial<TicketFormValue>) {
    setTickets((current) =>
      current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    )
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {event ? <input type="hidden" name="id" value={event.id} /> : null}
      <Field label="Title" htmlFor="title">
        <Input id="title" name="title" defaultValue={event?.title} required />
      </Field>
      <Field label="Venue" htmlFor="venue">
        <Input id="venue" name="venue" defaultValue={event?.venue} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Starts" htmlFor="startsAt">
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={event?.startsAtLocal}
            required
          />
        </Field>
        <Field label="Ends" htmlFor="endsAt">
          <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={event?.endsAtLocal} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Capacity" htmlFor="capacity">
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            step={1}
            defaultValue={event?.capacity ?? 100}
            required
          />
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={event?.status ?? "draft"}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </Select>
        </Field>
      </div>
      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={4} defaultValue={event?.description} />
      </Field>
      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-medium">Ticket types</legend>
        <p className="text-sm text-muted-foreground">
          Price is in euros. Quantity counts toward the event capacity. Leave a row blank to skip it.
        </p>
        {tickets.map((ticket, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[1fr_7rem_6rem_auto]">
            <Input
              name="ticketName"
              aria-label="Ticket name"
              placeholder="Name"
              value={ticket.name}
              onChange={(change) => updateTicket(index, { name: change.target.value })}
            />
            <Input
              name="ticketPrice"
              aria-label="Price in euros"
              inputMode="decimal"
              placeholder="0.00"
              value={ticket.price}
              onChange={(change) => updateTicket(index, { price: change.target.value })}
            />
            <Input
              name="ticketQuantity"
              aria-label="Quantity"
              type="number"
              min={1}
              step={1}
              placeholder="Qty"
              value={ticket.quantity}
              onChange={(change) => updateTicket(index, { quantity: change.target.value })}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setTickets((current) => current.filter((_, row) => row !== index))}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          className="self-start"
          onClick={() => setTickets((current) => [...current, emptyTicket()])}
        >
          Add ticket type
        </Button>
      </fieldset>
      <FormNote message={state?.error} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : event ? "Save event" : "Create event"}
      </Button>
    </form>
  )
}
