export function proxyUrl(url: string | null | undefined, width = 96): string | null {
  if (!url) return null;
  return `/api/v1/images/proxy?url=${encodeURIComponent(url)}&w=${width}`;
}
