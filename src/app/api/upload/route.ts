import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const dir = formData.get('dir') as string || 'uploads'

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadDir = path.join(process.cwd(), 'public', dir)
    await mkdir(uploadDir, { recursive: true })

    const fileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const filePath = path.join(uploadDir, fileName)
    await writeFile(filePath, buffer)

    return NextResponse.json({ path: `/${dir}/${fileName}` })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
