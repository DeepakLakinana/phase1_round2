import { NextResponse, NextRequest } from 'next/server';
import { readData } from '@/lib/fileStore';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const teamId = req.headers.get('authorization')?.split(' ')[1] || req.cookies.get('teamId')?.value;
  if (!teamId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await readData();
  const team = data.teams.find((t: { teamId: string; [key: string]: unknown }) => t.teamId === teamId);
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  if (!team.isCompleted) {
    return NextResponse.json({ error: 'Mission not completed yet' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    teamName: team.name,
    startTime: team.startTime,
    endTime: team.endTime || new Date(),
    isCompleted: team.isCompleted,
  });
}
