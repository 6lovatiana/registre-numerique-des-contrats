/** Reference rate used only to translate the legacy/demo euro amounts (2026-10-27). */
export const EUR_TO_MGA_REFERENCE_RATE = 5_077.086

export function eurosToMGA(amount: number) {
  return Math.round(amount * EUR_TO_MGA_REFERENCE_RATE)
}

export const ESCALATION_THRESHOLD_MGA = eurosToMGA(50_000)
