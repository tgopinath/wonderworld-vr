// Parent PIN: stored as salted SHA-256, never in plain text.
// This is a local parental gate, not an account password — Phase 5 adds real server auth.

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function newSalt(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return toHex(bytes.buffer)
}

export async function hashPin(pin: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${pin}`)
  return toHex(await crypto.subtle.digest('SHA-256', data))
}

export function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}

/** Grown-up check shown before PIN entry: a multiplication a young child is unlikely to know. */
export function grownUpQuestion(rng: () => number = Math.random): { text: string; answer: number } {
  const a = 6 + Math.floor(rng() * 4)
  const b = 6 + Math.floor(rng() * 4)
  return { text: `${a} × ${b}`, answer: a * b }
}
