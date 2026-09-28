export function dbErrorMessage(error: { message: string }) {
  const line = error.message.split("\n")[0] ?? error.message
  return line.replace(/^.*ERROR:\s*/, "")
}
