export function normalizeUrl(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error("URL is required");
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  return url.toString();
}

export function getDomain(input: string) {
  const url = new URL(normalizeUrl(input));
  return url.hostname.replace(/^www\./, "");
}
