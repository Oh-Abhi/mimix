import { NextResponse } from 'next/server'
import { deleteArticle } from '@/lib/data'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  deleteArticle(id)
  return NextResponse.json({ success: true })
}
