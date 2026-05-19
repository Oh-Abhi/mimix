import { NextResponse } from 'next/server'
import { getArticles, addArticle } from '@/lib/data'
import { Article } from '@/lib/types'

export async function GET() {
  const articles = getArticles()
  return NextResponse.json(articles)
}

export async function POST(req: Request) {
  const body = await req.json() as Article
  addArticle(body)
  return NextResponse.json({ success: true })
}
