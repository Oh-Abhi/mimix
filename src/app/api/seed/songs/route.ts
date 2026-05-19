import { NextResponse } from 'next/server'
import { getSongs } from '@/lib/data'
export async function GET() { return NextResponse.json(getSongs()) }
