export type OgData = {
  og_title?: string
  og_description?: string
  og_image?: string
  og_site_name?: string
  favicon?: string
}

function extractMeta(html: string, property: string): string | undefined {
  // Try property= and name= in both attribute orders, with both quote styles
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m?.[1]) return decodeHtmlEntities(m[1])
  }
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
}

function resolveUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href
  } catch {
    return href
  }
}

export async function fetchOg(url: string): Promise<OgData> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ThreadBot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return {}
    const html = await res.text()

    const ogImage = extractMeta(html, 'og:image')
    const faviconMatch = html.match(/<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i)
    const faviconHref = faviconMatch?.[1]

    return {
      og_title: extractMeta(html, 'og:title'),
      og_description: extractMeta(html, 'og:description'),
      og_image: ogImage ? resolveUrl(ogImage, url) : undefined,
      og_site_name: extractMeta(html, 'og:site_name'),
      favicon: faviconHref ? resolveUrl(faviconHref, url) : `${new URL(url).origin}/favicon.ico`,
    }
  } catch {
    return {}
  }
}
