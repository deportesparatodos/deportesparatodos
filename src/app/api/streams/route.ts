
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const API_ENDPOINTS = {
  'live': 'https://streamed.pk/api/matches/live',
  'all-today': 'https://streamed.pk/api/matches/all-today',
  'sports': 'https://streamed.pk/api/sports',
  'stream': 'https://streamed.pk/api/stream',
  'streamtp': 'https://streamtpglobal.com/eventos.json',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as keyof typeof API_ENDPOINTS;
  
  if (!type) {
    return NextResponse.json({ error: '`type` parameter is required' }, { status: 400 });
  }

  // Handle specific stream requests (e.g., /api/streams?type=stream&source=xxx&id=yyy)
  if (type === 'stream') {
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    if (!source || !id) {
      return NextResponse.json({ error: '`source` and `id` are required for type=stream' }, { status: 400 });
    }
    
    const apiUrl = `${API_ENDPOINTS.stream}/${source}/${id}`;
    
    try {
      const response = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error fetching from ${apiUrl}: ${response.status} ${response.statusText}`, errorBody);
        return NextResponse.json({ error: `Failed to fetch stream: ${response.statusText}` }, { status: response.status });
      }
      const data = await response.json();
      return NextResponse.json(data);

    } catch (error) {
      console.error(`Error in API route for ${apiUrl}:`, error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  // Handle other list-based requests
  const apiUrl = API_ENDPOINTS[type];

  if (!apiUrl) {
    return NextResponse.json({ error: 'Invalid `type` parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(apiUrl, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 1800 }, // Cache for 30 minutes
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error fetching from ${apiUrl}: ${response.status} ${response.statusText}`, {errorBody});
        // Return an empty array to prevent frontend errors if the external API fails
        return NextResponse.json([], { status: 200 });
    }
    
    const data = await response.json();
    
    // Ensure the response is always an array
    if (!Array.isArray(data)) {
        console.warn(`API for type '${type}' did not return an array. Returning empty array instead.`);
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in API route for ${apiUrl}:`, error);
    // Return an empty array to prevent frontend errors on network issues or timeouts
    return NextResponse.json([], { status: 200 });
  }
}
