export type EventStatus = "draft" | "published"

export type TicketInput = {
  name: string
  price_cents: number
  quantity: number
}

export type EventInput = {
  title: string
  description: string | null
  venue: string | null
  starts_at: string
  ends_at: string | null
  capacity: number
  status: EventStatus
  tickets: TicketInput[]
}

export type TicketFormValue = {
  name: string
  price: string
  quantity: string
}

const publishedNeedsTicket = "A published event needs at least one ticket type."
const overCapacity = "Ticket quantities are over the event capacity."

export function centsToEurosInput(cents: number) {
  const euros = Math.floor(cents / 100)
  const fraction = String(cents % 100).padStart(2, "0")
  return `${euros}.${fraction}`
}

export function formatEuros(cents: number) {
  return new Intl.NumberFormat("en", { style: "currency", currency: "EUR" }).format(cents / 100)
}

function eurosToCents(value: string) {
  const match = value.trim().match(/^(\d+)(?:\.(\d{1,2}))?$/)
  if (!match) return null
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"))
}

function optionalText(value: string, max: number, label: string) {
  const trimmed = value.trim()
  if (!trimmed) return { ok: true as const, value: null }
  if (trimmed.length > max) return { ok: false as const, error: `${label} must be ${max} characters or fewer.` }
  return { ok: true as const, value: trimmed }
}

export function readEvent(formData: FormData): { ok: true; value: EventInput } | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim()
  const description = optionalText(String(formData.get("description") ?? ""), 4000, "Description")
  const venue = optionalText(String(formData.get("venue") ?? ""), 160, "Venue")
  const startsAt = new Date(String(formData.get("startsAt") ?? ""))
  const endsRaw = String(formData.get("endsAt") ?? "")
  const endsAt = endsRaw ? new Date(endsRaw) : null
  const capacity = Number(formData.get("capacity"))
  const status = String(formData.get("status") ?? "draft")
  const names = formData.getAll("ticketName").map(String)
  const prices = formData.getAll("ticketPrice").map(String)
  const quantities = formData.getAll("ticketQuantity").map(String)

  if (!title) return { ok: false, error: "Title is required." }
  if (title.length > 140) return { ok: false, error: "Title must be 140 characters or fewer." }
  if (!description.ok) return description
  if (!venue.ok) return venue
  if (Number.isNaN(startsAt.getTime())) return { ok: false, error: "Start time is required." }
  if (endsAt && Number.isNaN(endsAt.getTime())) return { ok: false, error: "End time is not a valid date." }
  if (endsAt && endsAt <= startsAt) return { ok: false, error: "End time must be after the start time." }
  if (!Number.isInteger(capacity) || capacity < 1) {
    return { ok: false, error: "Capacity must be a whole number greater than zero." }
  }
  if (status !== "draft" && status !== "published") {
    return { ok: false, error: "Status must be draft or published." }
  }

  const tickets: TicketInput[] = []
  const rowCount = Math.max(names.length, prices.length, quantities.length)
  for (let index = 0; index < rowCount; index += 1) {
    const name = (names[index] ?? "").trim()
    const price = (prices[index] ?? "").trim()
    const quantityRaw = (quantities[index] ?? "").trim()
    if (!name && !price && !quantityRaw) continue
    if (!name || !price || !quantityRaw) {
      return { ok: false, error: "Each ticket type needs a name, a price, and a quantity." }
    }
    if (name.length > 80) return { ok: false, error: "Ticket names must be 80 characters or fewer." }
    const priceCents = eurosToCents(price)
    const quantity = Number(quantityRaw)
    if (priceCents === null) return { ok: false, error: "Ticket prices use euros, such as 12 or 12.50." }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, error: "Ticket quantity must be a whole number greater than zero." }
    }
    tickets.push({ name, price_cents: priceCents, quantity })
  }

  const soldCapacity = tickets.reduce((sum, ticket) => sum + ticket.quantity, 0)
  if (soldCapacity > capacity) return { ok: false, error: overCapacity }
  if (status === "published" && tickets.length === 0) return { ok: false, error: publishedNeedsTicket }

  return {
    ok: true,
    value: {
      title,
      description: description.value,
      venue: venue.value,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt ? endsAt.toISOString() : null,
      capacity,
      status,
      tickets,
    },
  }
}
