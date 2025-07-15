// /src/app/api/ppv/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://ppvs.su/api/streams', {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PPV events: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in PPV API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
