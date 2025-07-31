
import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!process.env.ABLY_API_KEY) {
    return NextResponse.json(
      { error: 'Missing ABLY_API_KEY environment variable' },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('clientId') || 'anonymous';
  
  const client = new Ably.Realtime({ key: process.env.ABLY_API_KEY });

  try {
    const tokenRequestData = await new Promise((resolve, reject) => {
        client.auth.createTokenRequest({ clientId: clientId }, (err, tokenRequest) => {
            if (err) {
                reject(err);
            } else {
                resolve(tokenRequest);
            }
        });
    });
    
    client.close();
    
    return NextResponse.json(tokenRequestData);

  } catch (err: any) {
    client.close();
    return NextResponse.json(
      { error: `Error creating Ably token request: ${err.message}` },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
