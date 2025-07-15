
// /src/app/api/streams/route.ts
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const API_ENDPOINTS = {
  'live': 'https://streamed.su/api/matches/live',
  'all-today': 'https://streamed.su/api/matches/all-today',
  'sports': 'https://streamed.su/api/sports',
  'ppv': 'https://ppvs.su/api/streams',
  'stream': 'https://streamed.su/api/stream', // Base URL for specific streams
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  
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
        cache: 'no-store',
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

  // Handle list-based requests (live, all-today, sports, ppv)
  const apiUrl = API_ENDPOINTS[type as keyof typeof API_ENDPOINTS];

  if (!apiUrl) {
    return NextResponse.json({ error: 'Invalid `type` parameter' }, { status: 400 });
  }

  try {
    const headers: HeadersInit = { 'Accept': 'application/json' };
    if (type === 'ppv') {
      headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0';
    }

    const response = await fetch(apiUrl, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error fetching from ${apiUrl}: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json({ error: `Failed to fetch data for type '${type}': ${response.statusText}` }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in API route for ${apiUrl}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
