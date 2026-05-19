import { NextResponse } from 'next/server'
import { getMusicCollections } from '@/lib/data'
export async function GET() { return NextResponse.json(getMusicCollections()) }
