import { EventForm } from "@/components/event-form"

export default function NewEventPage() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">New event</h1>
        <p className="text-sm text-muted-foreground">
          Drafts can omit ticket types. Publishing needs at least one.
        </p>
      </div>
      <EventForm />
    </div>
  )
}
