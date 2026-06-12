import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/fileStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { settings } = await readData();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const settings = await req.json();
  const data = await readData();
  await writeData({ ...data, settings });
  return NextResponse.json({ success: true });
}
