import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/fileStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { puzzles } = await readData();
  return NextResponse.json(puzzles);
}

export async function POST(req: Request) {
  try {
    const { puzzles } = await req.json();
    const data = await readData();
    data.puzzles = puzzles;
    await writeData(data);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
