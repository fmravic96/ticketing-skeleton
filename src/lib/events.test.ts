import { describe, expect, it } from "vitest"

import { centsToEurosInput, readEvent } from "@/lib/events"

function eventForm(
  fields: Record<string, string>,
  tickets: { name?: string; price?: string; quantity?: string }[] = [],
) {
  const data = new FormData()
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  for (const ticket of tickets) {
    data.append("ticketName", ticket.name ?? "")
    data.append("ticketPrice", ticket.price ?? "")
    data.append("ticketQuantity", ticket.quantity ?? "")
  }
  return data
}

const base = {
  title: "Hall show",
  startsAt: "2026-11-02T20:00",
  capacity: "80",
  status: "draft",
}

describe("readEvent", () => {
  it("accepts a draft with no ticket types", () => {
    const result = readEvent(eventForm(base))
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.status).toBe("draft")
    expect(result.value.tickets).toEqual([])
    expect(result.value.description).toBeNull()
  })

  it("stores euro prices as cents and skips a blank row", () => {
    const result = readEvent(
      eventForm(base, [
        { name: "Regular", price: "12.50", quantity: "60" },
        { name: "", price: "", quantity: "" },
        { name: "Free list", price: "0", quantity: "10" },
      ]),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.tickets).toEqual([
      { name: "Regular", price_cents: 1250, quantity: 60 },
      { name: "Free list", price_cents: 0, quantity: 10 },
    ])
  })

  it("rejects a published event without ticket types", () => {
    const result = readEvent(eventForm({ ...base, status: "published" }))
    expect(result).toEqual({
      ok: false,
      error: "A published event needs at least one ticket type.",
    })
  })

  it("rejects ticket quantities above capacity", () => {
    const result = readEvent(
      eventForm({ ...base, capacity: "10" }, [{ name: "Regular", price: "10", quantity: "11" }]),
    )
    expect(result).toEqual({
      ok: false,
      error: "Ticket quantities are over the event capacity.",
    })
  })

  it("rejects an end time that is not after the start", () => {
    const result = readEvent(eventForm({ ...base, endsAt: "2026-11-02T19:00" }))
    expect(result).toEqual({ ok: false, error: "End time must be after the start time." })
  })

  it("rejects a partial ticket row and a price with too many decimals", () => {
    expect(readEvent(eventForm(base, [{ name: "Regular", price: "10" }]))).toEqual({
      ok: false,
      error: "Each ticket type needs a name, a price, and a quantity.",
    })
    expect(
      readEvent(eventForm(base, [{ name: "Regular", price: "10.555", quantity: "1" }])),
    ).toEqual({
      ok: false,
      error: "Ticket prices use euros, such as 12 or 12.50.",
    })
  })
})

describe("centsToEurosInput", () => {
  it("prints cents as a euro input", () => {
    expect(centsToEurosInput(1500)).toBe("15.00")
    expect(centsToEurosInput(5)).toBe("0.05")
  })
})
