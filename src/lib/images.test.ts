import { describe, expect, it } from "vitest"

import { eventImageMaxBytes, eventImageObjectPath, readEventImage } from "@/lib/images"

const orgId = "11111111-1111-4111-8111-111111111111"

describe("readEventImage", () => {
  it("skips an empty file input", () => {
    expect(readEventImage(new File([], "cover.png", { type: "image/png" }))).toEqual({
      ok: true,
      file: null,
    })
    expect(readEventImage(null)).toEqual({ ok: true, file: null })
  })

  it("accepts a jpeg, png, or webp within 2 MB", () => {
    const file = new File([new Uint8Array([1, 2, 3])], "cover.webp", { type: "image/webp" })
    const result = readEventImage(file)
    expect(result.ok).toBe(true)
    if (!result.ok || !result.file) return
    expect(result.extension).toBe("webp")
  })

  it("rejects a different type and a file over 2 MB", () => {
    expect(readEventImage(new File(["gif"], "cover.gif", { type: "image/gif" }))).toEqual({
      ok: false,
      error: "Image must be a JPEG, PNG, or WebP.",
    })
    const big = new File([new Uint8Array(eventImageMaxBytes + 1)], "cover.jpg", {
      type: "image/jpeg",
    })
    expect(readEventImage(big)).toEqual({ ok: false, error: "Image must be 2 MB or smaller." })
  })
})

describe("eventImageObjectPath", () => {
  it("keeps the file under the organization id", () => {
    expect(eventImageObjectPath(orgId, "jpg")).toMatch(
      /^11111111-1111-4111-8111-111111111111\/[0-9a-f-]{36}\.jpg$/,
    )
  })
})
