import { NextResponse, NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/fileStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const teamId = req.headers.get('authorization')?.split(' ')[1] || req.cookies.get('teamId')?.value;
  if (!teamId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { puzzleId, answer } = await req.json();
  const data = await readData();
  
  const team = data.teams.find((t: { teamId: string; [key: string]: unknown }) => t.teamId === teamId);
  const puzzle = data.puzzles.find((p: { _id: string; [key: string]: unknown }) => p._id === puzzleId);

  if (!team || !puzzle) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if ((team.solvedPuzzleIds || []).includes(puzzle._id)) {
    return NextResponse.json({ error: 'Already solved' }, { status: 400 });
  }

  const normalizedUserAnswer = answer.toLowerCase().trim().replace(/\s+/g, ' ');
  const isCorrect = puzzle.acceptedAnswers.some((accepted: string) => 
    accepted.toLowerCase().trim().replace(/\s+/g, ' ') === normalizedUserAnswer
  );



  if (isCorrect) {
    if (puzzle.rewardLetter) {
      team.collectedLetters.push(puzzle.rewardLetter);
    }
    team.solvedPuzzleIds = [...(team.solvedPuzzleIds || []), puzzle._id];
    team.isCompleted = team.solvedPuzzleIds.length >= data.puzzles.length;
    await writeData(data);
    return NextResponse.json({ correct: true, letter: puzzle.rewardLetter, isCompleted: team.isCompleted });
  } else {
    team.attempts = (team.attempts || 0) + 1;
    await writeData(data);
    return NextResponse.json({ correct: false, attempts: team.attempts });
  }
}
