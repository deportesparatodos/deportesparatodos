
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const API_ENDPOINTS = {
  'live': 'https://cors-anywhere.herokuapp.com/https://streamed.pk/api/matches/live',
  'all-today': 'https://cors-anywhere.herokuapp.com/https://streamed.pk/api/matches/all-today',
  'sports': 'https://cors-anywhere.herokuapp.com/https://streamed.pk/api/sports',
  'stream': 'https://cors-anywhere.herokuapp.com/https://streamed.pk/api/stream',
  'streamtp': 'https://streamtpglobal.com/eventos.json',
  'tc-chaser': 'https://tc-chaser.vercel.app/api/events',
  'agenda': 'https://agenda-dpt.vercel.app/api/events',
};

async function fetchWithBrowser(url: string) {
  // This function is no longer needed but kept to avoid breaking changes if referenced elsewhere.
  // It will now just do a normal fetch.
  try {
    const response = await fetch(url, {
        headers: {
            'Origin': 'https://streamed.pk', // Try to mimic the origin
            'X-Requested-With': 'XMLHttpRequest'
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching directly from ${url}:`, error);
    return null;
  }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as keyof typeof API_ENDPOINTS;
  
  if (!type) {
    return NextResponse.json({ error: '`type` parameter is required' }, { status: 400 });
  }
  
  if (type === 'stream') {
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    if (!source || !id) {
      return NextResponse.json({ error: '`source` and `id` are required for type=stream' }, { status: 400 });
    }
    
    // Note: The proxy might not work for this dynamic path, testing needed.
    const apiUrl = `${API_ENDPOINTS.stream}/${source}/${id}`;
    
    try {
      const response = await fetch(apiUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
      if (!response.ok) {
         throw new Error(`Failed to fetch stream data with status ${response.status}`);
      }
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error(`Error in API route for ${apiUrl}:`, error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }

  const apiUrl = API_ENDPOINTS[type];

  if (!apiUrl) {
    return NextResponse.json({ error: 'Invalid `type` parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(apiUrl, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error fetching from ${apiUrl}: ${response.status} ${response.statusText}`, {errorBody});
        return NextResponse.json([], { status: 200 });
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data) && !(typeof data === 'object' && data !== null) ) {
        console.warn(`API for type '${type}' did not return a valid JSON object/array. Returning empty array instead.`);
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in API route for ${apiUrl}:`, error);
    return NextResponse.json([], { status: 200 });
  }
}
