import { NextResponse } from 'next/server'
import { getMusicCollections, addMusicCollection, updateMusicCollection } from '@/lib/data'
import { MusicCollection } from '@/lib/types'

export async function GET() {
  return NextResponse.json(getMusicCollections())
}

export async function POST(req: Request) {
  const body = await req.json() as MusicCollection
  addMusicCollection(body)
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const body = await req.json() as { id: string } & Partial<MusicCollection>
  const { id, ...updates } = body
  updateMusicCollection(id, updates)
  return NextResponse.json({ success: true })
}
