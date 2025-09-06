
import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const API_ENDPOINTS: Record<string, string> = {
  'live': 'https://streamed.pk/api/matches/live',
  'all-today': 'https://streamed.pk/api/matches/all-today',
  'sports': 'https://streamed.pk/api/sports',
  'stream': 'https://streamed.pk/api/stream', 
  'streamtp': 'https://streamtpglobal.com/eventos.json',
  'agenda': 'https://agenda-dpt.vercel.app/api/events',
};

async function fetchData(url: string, type: string) {
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    const isStreamedPk = url.includes('streamed.pk');

    // Strategy for streamed.pk: Try direct fetch first, then fallback to scraper.
    if (isStreamedPk) {
        try {
            console.log(`Attempting direct fetch for: ${url}`);
            const directResponse = await fetch(url, {
                next: { revalidate: 60 }, // Cache direct attempts for 1 minute
            });

            if (directResponse.ok) {
                const data = await directResponse.json();
                // Check if data is a non-empty array, if so, return it.
                if (Array.isArray(data) && data.length > 0) {
                    console.log(`Direct fetch successful for: ${url}`);
                    return data;
                }
                 // If data is an object (for single stream), it's also valid
                if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
                    console.log(`Direct fetch successful for single object from: ${url}`);
                    return data;
                }
                console.log(`Direct fetch for ${url} returned empty or invalid data. Proceeding to scraper.`);
            } else {
                 console.warn(`Direct fetch for ${url} failed with status: ${directResponse.status}. Proceeding to scraper.`);
            }
        } catch (e) {
            console.warn(`Direct fetch for ${url} threw an error. Proceeding to scraper.`, e);
        }

        // Fallback to Scraper API if direct fetch fails or returns empty array
        if (scraperApiKey) {
            const scraperUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`;
            console.log(`Falling back to ScraperAPI for: ${url}`);
            try {
                const scraperResponse = await fetch(scraperUrl, {
                    next: { revalidate: 0 }, // Do not cache scraper responses
                });
                if (!scraperResponse.ok) {
                    const errorBody = await scraperResponse.text();
                    console.error(`ScraperAPI fetch failed for ${url}: ${scraperResponse.status}`, { errorBody });
                    throw new Error(`ScraperAPI fetch failed with status ${scraperResponse.status}`);
                }
                return scraperResponse.json();
            } catch (error) {
                console.error(`Error in ScraperAPI fallback for ${url}:`, error);
                return null;
            }
        } else {
            console.error("ScraperAPI key is not configured. Cannot fall back.");
            return null;
        }

    } else {
        // For other endpoints, use the direct fetch as before.
        try {
            const response = await fetch(url, {
                next: { revalidate: 300 }, // 5 min for others
            });

            if (!response.ok) {
                const errorBody = await response.text();
                console.error(`Error fetching from ${url}: ${response.status} ${response.statusText}`, {errorBody});
                throw new Error(`Failed to fetch from ${url} with status ${response.status}`);
            }
            
            return response.json();
        } catch (error) {
            console.error(`Error in fetchData for ${url}:`, error);
            return null; // Return null on any fetch error
        }
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
    
    const apiUrl = `${API_ENDPOINTS.stream}/${source}/${id}`;
    
    try {
      const data = await fetchData(apiUrl, type);
       if (data === null) {
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
    const data = await fetchData(apiUrl, type);
    
    if (data === null) {
        console.warn(`API for type '${type}' failed to fetch or returned null. Returning empty array instead.`);
        return NextResponse.json([], { status: 200 });
    }

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

    
