
import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json(
      { error: 'ABLY_API_KEY environment variable not set' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const clientId = request.nextUrl.searchParams.get('clientId') || 'anonymous';
  
  try {
    const ably = new Ably.Rest({ key: process.env.ABLY_API_KEY });
    const tokenRequest = await ably.auth.createTokenRequest({ 
        clientId: clientId,
    });
    return NextResponse.json(tokenRequest);
  } catch (error: any) {
    console.error('Ably token request error:', error);
    return NextResponse.json(
      { error: `Failed to create Ably token: ${error.message}` },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
