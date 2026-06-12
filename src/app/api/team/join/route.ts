import { NextResponse } from 'next/server';
import { readData, writeData } from '@/lib/fileStore';
import { nanoid } from 'nanoid';
import credentials from '@/lib/credentials.json';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { fullName, contactNumber } = await req.json();

    if (!fullName || !contactNumber) {
      return NextResponse.json({ error: 'Missing full name or contact number' }, { status: 400 });
    }

    const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

    const isValid = credentials.some(
      (c) => normalizeName(c.fullName) === normalizeName(fullName) && 
             c.contactNumber.trim() === contactNumber.trim()
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials. Please verify your Full Name and Contact Number.' }, { status: 401 });
    }

    const data = await readData();

    // Check if team already exists
    let team = (data.teams || []).find((t: any) => t.name.trim().toLowerCase() === fullName.trim().toLowerCase());

    if (!team) {
      // Create new team
      const teamId = nanoid(8).toLowerCase();
      team = {
        name: fullName.trim(),
        teamId,
        startTime: new Date(),
        solvedPuzzleIds: [],
        attempts: 0,
        collectedLetters: [],
        isCompleted: false
      };
      data.teams = [...(data.teams || []), team];
      await writeData(data);
    }

    const response = NextResponse.json({ teamId: team.teamId, name: team.name });
    response.cookies.set('teamId', team.teamId, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });
    return response;
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
