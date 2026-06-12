import { NextResponse, NextRequest } from 'next/server';
import { readData, writeData } from '@/lib/fileStore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const teamId = req.headers.get('authorization')?.split(' ')[1] || req.cookies.get('teamId')?.value;
  if (!teamId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { guess } = await req.json();
  if (!guess) return NextResponse.json({ error: 'Missing guess' }, { status: 400 });

  const data = await readData();
  const team = data.teams.find((t: { teamId: string; [key: string]: unknown }) => t.teamId === teamId);
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });

  const targetWord = (data.settings?.targetWord || 'AMPLITUDE').toUpperCase();
  const correct = guess.toUpperCase() === targetWord;

  if (correct) {
    team.isCompleted = true;
    team.endTime = new Date();
    await writeData(data);

    // Submit final answer to Google Form
    if (data.settings?.googleFormUrl) {
      try {
        const formUrl = data.settings.googleFormUrl;
        const teamIdField = data.settings.teamIdFieldId || 'Team name';
        const answerField = data.settings.answerFieldId || 'Answer to the question';
        
        const formResponseUrl = formUrl.replace(/\/viewform$/, '/formResponse').replace(/\/viewform\?.*/, '/formResponse');
        
        const getEntryKey = (fieldId: string) => {
          if (fieldId.startsWith('entry.')) return fieldId;
          if (/^\d+$/.test(fieldId)) return `entry.${fieldId}`;
          return `entry.${fieldId}`;
        };

        const params = new URLSearchParams();
        params.append(getEntryKey(teamIdField), team.name);
        params.append(getEntryKey(answerField), guess);

        try {
          await fetch(formResponseUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
          });
        } catch (err) {
          console.error('Google Form submission fetch error:', err);
        }
      } catch (err) {
        console.error('Error submitting to Google Form:', err);
      }
    }

    return NextResponse.json({ correct: true, message: 'Master Override Successful! Access Granted.' });
  } else {
    return NextResponse.json({ correct: false, message: 'Decryption failed. Hash mismatch.' });
  }
}
