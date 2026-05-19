import { NextResponse } from 'next/server'
import { getSongs, addSong } from '@/lib/data'
import { Song } from '@/lib/types'

export async function GET() {
  const songs = getSongs()
  return NextResponse.json(songs)
}

export async function POST(req: Request) {
  const body = await req.json() as Song
  addSong(body)
  return NextResponse.json({ success: true })
}
