
import { NextRequest, NextResponse } from 'next/server';
import Ably from 'ably';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    if (!process.env.NEXT_PUBLIC_ABLY_API_KEY) {
        console.error('Missing ABLY_API_KEY environment variable');
        return NextResponse.json({ error: 'Server configuration error: Missing API Key' }, { status: 500 });
    }
    
    // Initialize Ably REST client inside the function
    const ably = new Ably.Rest(process.env.NEXT_PUBLIC_ABLY_API_KEY);
    
    const clientId = request.nextUrl.searchParams.get('clientId') || `client-${Math.random().toString(36).substr(2, 9)}`;

    try {
        const tokenRequest = await ably.auth.createTokenRequest({ clientId: clientId });
        return NextResponse.json(tokenRequest);
    } catch (error: any) {
        console.error('Ably Auth Error:', error);
        return NextResponse.json({ error: `Ably token request failed: ${error.message}` }, { status: 500 });
    }
}
