import { NextResponse } from 'next/server'

const API_KEY = process.env.YOUTUBE_API_KEY

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  const videoId = searchParams.get('id')

  if (!API_KEY) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  // Fetch single video details
  if (videoId) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${API_KEY}`
    const res = await fetch(url)
    const data = await res.json()
    const item = data.items?.[0]
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({
      id: item.id,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.maxres?.url || item.snippet.thumbnails?.high?.url || `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
      duration: item.contentDetails.duration,
    })
  }

  // Search
  if (!q) return NextResponse.json({ error: 'No query' }, { status: 400 })

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=8&q=${encodeURIComponent(q + ' song')}&key=${API_KEY}&videoCategoryId=10`
  const res = await fetch(url, { next: { revalidate: 60 } })
  const data = await res.json()

  const results = (data.items || []).map((item: {
    id: { videoId: string }
    snippet: { title: string; channelTitle: string; thumbnails: { high?: { url: string }; default?: { url: string } } }
  }) => ({
    id: item.id.videoId,
    title: item.snippet.title,
    channel: item.snippet.channelTitle,
    thumbnail: item.snippet.thumbnails?.high?.url || `https://img.youtube.com/vi/${item.id.videoId}/hqdefault.jpg`,
  }))

  return NextResponse.json(results)
}
