
import { kv } from '@vercel/kv';
import { NextResponse, type NextRequest } from 'next/server';
import type { Event } from '@/components/event-carousel';

export interface RemoteSession {
  id: string;
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  timestamp: number;
}

export const dynamic = 'force-dynamic';

// Generate a random 4-digit code
const generateCode = async (): Promise<string> => {
    let code: string;
    let existingSession: RemoteSession | null;
    do {
        code = Math.floor(1000 + Math.random() * 9000).toString();
        existingSession = await kv.get(`remote:${code}`);
    } while (existingSession); // Ensure code is unique
    return code;
};

// POST - Create a new remote session
export async function POST() {
  try {
    const code = await generateCode();
    const newSession: RemoteSession = {
      id: code,
      selectedEvents: Array(9).fill(null),
      viewOrder: Array.from({ length: 9 }, (_, i) => i),
      timestamp: Date.now(),
    };
    await kv.set(`remote:${code}`, newSession, { ex: 3600 }); // Expire after 1 hour
    return NextResponse.json(newSession);
  } catch (error) {
    console.error('REMOTE_SESSION POST Error:', error);
    return NextResponse.json({ error: 'Failed to create remote session' }, { status: 500 });
  }
}

// GET - Retrieve session state
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    try {
        const session: RemoteSession | null = await kv.get(`remote:${id}`);
        if (!session) {
            return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
        }
        return NextResponse.json(session);
    } catch (error) {
        console.error('REMOTE_SESSION GET Error:', error);
        return NextResponse.json({ error: 'Failed to retrieve session state' }, { status: 500 });
    }
}


// PUT - Update session state
export async function PUT(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    try {
        const body = await request.json();
        const { selectedEvents, viewOrder } = body;

        const currentSession: RemoteSession | null = await kv.get(`remote:${id}`);
        if (!currentSession) {
            return NextResponse.json({ error: 'Session not found or expired' }, { status: 404 });
        }
        
        const updatedSession: RemoteSession = {
            ...currentSession,
            selectedEvents: selectedEvents ?? currentSession.selectedEvents,
            viewOrder: viewOrder ?? currentSession.viewOrder,
            timestamp: Date.now(),
        };

        await kv.set(`remote:${id}`, updatedSession, { ex: 3600 });
        return NextResponse.json(updatedSession);

    } catch (error) {
        console.error('REMOTE_SESSION PUT Error:', error);
        return NextResponse.json({ error: 'Failed to update session state' }, { status: 500 });
    }
}

// DELETE - End a remote session
export async function DELETE(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    try {
        await kv.del(`remote:${id}`);
        return NextResponse.json({ message: 'Session terminated successfully' });
    } catch (error) {
        console.error('REMOTE_SESSION DELETE Error:', error);
        return NextResponse.json({ error: 'Failed to terminate session' }, { status: 500 });
    }
}
