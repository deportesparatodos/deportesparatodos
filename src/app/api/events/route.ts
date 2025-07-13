// /src/app/api/events/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://agenda-dpt.vercel.app/api/events', {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data
    });

    if (!response.ok) {
      // Forward the status and statusText from the external API
      return NextResponse.json(
        { error: `Failed to fetch events: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Forward the data with a 200 OK status
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in events API route:', error);
    // Return a generic server error
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
