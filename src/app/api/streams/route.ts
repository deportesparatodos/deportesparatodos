
// /src/app/api/streams/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const source = searchParams.get('source');
  const id = searchParams.get('id');

  if (!source || !id) {
    return NextResponse.json(
      { error: 'Source and ID are required parameters' },
      { status: 400 }
    );
  }

  try {
    const apiUrl = `https://streamed.su/api/stream/${source}/${id}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store', // Ensure fresh data for live streams
    });

    if (!response.ok) {
      // Log the error for debugging but return a generic message
      console.error(`Failed to fetch streams from ${apiUrl}: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Error Body:', errorBody);
      return NextResponse.json(
        { error: `Failed to fetch streams: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // The response is an array of stream objects
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error in streams API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

    