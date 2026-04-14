export const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
] as const;

export const privatePageHeaders = [
  ...baseSecurityHeaders,
  { key: "Cache-Control", value: "no-store, max-age=0" },
] as const;

export function securityHeadersObject() {
  return Object.fromEntries(baseSecurityHeaders.map((header) => [header.key, header.value]));
}
