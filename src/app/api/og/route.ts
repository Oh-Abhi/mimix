import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'No URL' }, { status: 400 })

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AviBot/1.0)' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()

    const getMeta = (prop: string): string => {
      const m =
        html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i')) ||
        html.match(new RegExp(`<meta[^>]+name=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i'))
      return m ? m[1] : ''
    }

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const title = getMeta('title') || (titleMatch ? titleMatch[1].trim() : '') || new URL(url).hostname
    const description = getMeta('description') || getMeta('og:description') || ''
    const image = getMeta('image') || ''
    const siteName = getMeta('site_name') || new URL(url).hostname

    // Estimate reading time (rough heuristic)
    const bodyText = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    const wordCount = bodyText.split(' ').filter(Boolean).length
    const readingTime = Math.max(1, Math.round(wordCount / 200))

    return NextResponse.json({ title, description, image, siteName, readingTime })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
