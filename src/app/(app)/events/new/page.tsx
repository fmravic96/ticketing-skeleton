import { EventForm } from "@/components/event-form"

export default function NewEventPage() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">New event</h1>
        <p className="text-sm text-muted-foreground">Title, start time, and a capacity number.</p>
      </div>
      <EventForm />
    </div>
  )
}
