import { NextResponse } from 'next/server'
import { getArticleCollections } from '@/lib/data'
export async function GET() { return NextResponse.json(getArticleCollections()) }
