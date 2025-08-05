
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

// URLs for the APIs we need to fetch data from.
const API_ENDPOINTS = {
  'live': 'https://streamed.pk/api/matches/live',
  'all-today': 'https://streamed.pk/api/matches/all-today',
  'sports': 'https://streamed.pk/api/sports',
  'stream': 'https://streamed.pk/api/stream', // This one needs path parameters
  'streamtp': 'https://streamtpglobal.com/eventos.json',
  'tc-chaser': 'https://tc-chaser.vercel.app/api/events',
  'agenda': 'https://agenda-dpt.vercel.app/api/events',
};

/**
 * Fetches data from a given URL, using a scraping API for streamed.pk to bypass Cloudflare.
 * @param url The URL to fetch.
 * @returns The JSON response from the URL.
 */
async function fetchData(url: string) {
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    
    let fetchUrl = url;

    // If the URL is for streamed.pk and an API key is provided, use the scraper service.
    if (url.includes('streamed.pk') && scraperApiKey) {
        const scraperUrl = new URL('https://api.scraperapi.com');
        scraperUrl.searchParams.set('api_key', scraperApiKey);
        scraperUrl.searchParams.set('url', url);
        fetchUrl = scraperUrl.toString();
    }
    
    const response = await fetch(fetchUrl, {
        next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
        const errorBody = await response.text();
        console.error(`Error fetching from ${url} (via ${fetchUrl}): ${response.status} ${response.statusText}`, {errorBody});
        throw new Error(`Failed to fetch from ${url} with status ${response.status}`);
    }
    
    return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as keyof typeof API_ENDPOINTS;
  
  if (!type) {
    return NextResponse.json({ error: '`type` parameter is required' }, { status: 400 });
  }
  
  // Handle the special case for single stream fetching
  if (type === 'stream') {
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    if (!source || !id) {
      return NextResponse.json({ error: '`source` and `id` are required for type=stream' }, { status: 400 });
    }
    
    const apiUrl = `${API_ENDPOINTS.stream}/${source}/${id}`;
    
    try {
      const data = await fetchData(apiUrl);
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
    const data = await fetchData(apiUrl);
    
    if (!Array.isArray(data) && !(typeof data === 'object' && data !== null) ) {
        console.warn(`API for type '${type}' did not return a valid JSON object/array. Returning empty array instead.`);
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in API route for ${apiUrl}:`, error);
    // Return an empty array on failure to prevent the entire page from breaking.
    return NextResponse.json([], { status: 200 }); 
  }
}
