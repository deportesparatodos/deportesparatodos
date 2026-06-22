import { NextResponse } from 'next/server';

// Global state store for local network usage
const globalAny: any = global;
if (!globalAny.remoteStateMap) {
  globalAny.remoteStateMap = new Map<string, { appState: any, lastUpdate: number, actions: any[] }>();
}
const stateMap = globalAny.remoteStateMap as Map<string, { appState: any, lastUpdate: number, actions: any[] }>;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const actionIndex = parseInt(searchParams.get('lastActionIndex') || '0', 10);
  
  if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

  const session = stateMap.get(code);
  if (!session) {
      return NextResponse.json({ state: null, actions: [], nextActionIndex: 0 });
  }

  const newActions = session.actions.slice(actionIndex);

  return NextResponse.json({ 
      state: session.appState, 
      actions: newActions,
      nextActionIndex: session.actions.length
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { code, type, payload, appState } = body;

  if (!code) return NextResponse.json({ success: false, error: 'Missing code' }, { status: 400 });

  let session = stateMap.get(code);
  if (!session) {
      session = { appState: null, lastUpdate: Date.now(), actions: [] };
      stateMap.set(code, session);
  }

  if (appState !== undefined) {
      session.appState = appState;
      session.lastUpdate = Date.now();
  }

  if (type) {
      session.actions.push({ type, payload, timestamp: Date.now() });
      // Keep only last 50 actions
      if (session.actions.length > 50) {
          session.actions = session.actions.slice(session.actions.length - 50);
      }
      session.lastUpdate = Date.now();
  }

  return NextResponse.json({ success: true });
}
