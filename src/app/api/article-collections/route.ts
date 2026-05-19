import { NextResponse } from 'next/server'
import { getArticleCollections, addArticleCollection, updateArticleCollection } from '@/lib/data'
import { ArticleCollection } from '@/lib/types'

export async function GET() {
  return NextResponse.json(getArticleCollections())
}

export async function POST(req: Request) {
  const body = await req.json() as ArticleCollection
  addArticleCollection(body)
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const body = await req.json() as { id: string } & Partial<ArticleCollection>
  const { id, ...updates } = body
  updateArticleCollection(id, updates)
  return NextResponse.json({ success: true })
}
