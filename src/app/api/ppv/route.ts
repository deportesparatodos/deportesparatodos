// /src/app/api/ppv/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://ppvs.su/api/streams', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
       // Log the error for better debugging on Vercel
      console.error(`Failed to fetch PPV events: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Error Body:', errorBody);
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
