import { NextResponse } from 'next/server'
import { buildCsv } from '@/lib/actions/admin/reports'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = (searchParams.get('type') ?? 'engagement') as 'engagement' | 'completion' | 'at-risk'
  const start = searchParams.get('start') ?? undefined
  const end = searchParams.get('end') ?? undefined

  try {
    const csv = await buildCsv(type, start, end)
    const fileName = `reports-${type}-${Date.now()}.csv`
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to export CSV'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
