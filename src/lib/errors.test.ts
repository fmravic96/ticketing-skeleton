import { describe, expect, it } from "vitest"

import { dbErrorMessage } from "@/lib/errors"

describe("dbErrorMessage", () => {
  it("keeps a plain database exception", () => {
    expect(dbErrorMessage({ message: "Ticket quantities are over the event capacity" })).toBe(
      "Ticket quantities are over the event capacity",
    )
  })

  it("drops the error prefix and later lines", () => {
    expect(
      dbErrorMessage({
        message: "ERROR: Title is required\nCONTEXT: PL/pgSQL function save_event",
      }),
    ).toBe("Title is required")
  })
})
