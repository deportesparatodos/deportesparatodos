
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
    let isScraper = false;

    // If the URL is for streamed.pk and an API key is provided, use the scraper service.
    if (url.includes('streamed.pk') && scraperApiKey) {
        fetchUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`;
        isScraper = true;
    }
    
    try {
        const response = await fetch(fetchUrl, {
            next: { revalidate: 300 }, // Cache for 5 minutes
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error fetching from ${url} (via ${fetchUrl}): ${response.status} ${response.statusText}`, {errorBody});
            throw new Error(`Failed to fetch from ${url} with status ${response.status}`);
        }
        
        return response.json();
    } catch (error) {
        console.error(`Error in fetchData for ${url}:`, error);
        return null; // Return null on any fetch error
    }
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
       if (data === null) {
          // If fetchData returns null, it means there was an error.
          return NextResponse.json({ error: 'Failed to fetch stream data' }, { status: 500 });
      }
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
    
    if (data === null) {
        // Log the failure and return an empty array to prevent breaking the client.
        console.warn(`API for type '${type}' failed to fetch. Returning empty array instead.`);
        return NextResponse.json([], { status: 200 });
    }

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
