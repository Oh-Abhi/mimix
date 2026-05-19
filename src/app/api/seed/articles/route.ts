import { NextResponse } from 'next/server'
import { getArticles } from '@/lib/data'
export async function GET() { return NextResponse.json(getArticles()) }
