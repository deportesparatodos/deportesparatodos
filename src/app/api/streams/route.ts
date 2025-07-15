// /src/app/api/streams/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const id = searchParams.get('id');

  // Handle PPV events
  if (source === 'ppv') {
    try {
      const response = await fetch('https://ppvs.su/api/streams', {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
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
      console.error('Error in PPV API fetch:', error);
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }
  }

  // Handle Streamed.su events
  if (!source || !id) {
    return NextResponse.json(
      { error: 'Source and ID are required parameters for non-PPV requests' },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `https://streamed.su/api/stream/${source}/${id}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Failed to fetch streams from ${apiUrl}: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Error Body:', errorBody);
      return NextResponse.json(
        { error: `Failed to fetch streams: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in streams API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
