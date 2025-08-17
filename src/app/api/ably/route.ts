import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// This endpoint securely provides the Ably API key to the client.
export async function GET() {
  const apiKey = process.env.ABLY_API_KEY;

  if (!apiKey) {
    console.error("Ably API Key is not configured on the server.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  return NextResponse.json({ apiKey });
}
