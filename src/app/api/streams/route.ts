
// /src/app/api/streams/route.ts
import { NextResponse, type NextRequest } from 'next/server';
const playwright = require('playwright-aws-lambda');

export const dynamic = 'force-dynamic';

const API_ENDPOINTS = {
  'live': 'https://streamed.su/api/matches/live',
  'all-today': 'https://streamed.su/api/matches/all-today',
  'sports': 'https://streamed.su/api/sports',
  'ppv': 'https://ppv.to/api/streams',
  'stream': 'https://streamed.su/api/stream',
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

  // Handle PPV requests with Playwright
  if (type === 'ppv') {
    let browser = null;
    try {
      console.log('Launching Playwright for PPV...');
      browser = await playwright.launchChromium({ headless: true });

      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto(API_ENDPOINTS.ppv, { waitUntil: 'networkidle' });
      
      const jsonText = await page.evaluate(() => {
          // Access the pre element which contains the JSON
          const preElement = document.querySelector('pre');
          return preElement ? preElement.innerText : document.body.innerText;
      });
      
      const data = JSON.parse(jsonText);
      console.log('Successfully fetched PPV data with Playwright.');
      return NextResponse.json(data);

    } catch (error: any) {
      console.error(`Error during Playwright execution for PPV:`, error);
      // Return an empty array or an error object to prevent the entire page from failing.
      return NextResponse.json({ success: false, streams: [] }, { status: 200 });
    } finally {
        if (browser) {
            await browser.close();
        }
    }
  }


  // Handle other list-based requests (live, all-today, sports)
  const apiUrl = API_ENDPOINTS[type as keyof typeof API_ENDPOINTS];

  if (!apiUrl) {
    return NextResponse.json({ error: 'Invalid `type` parameter' }, { status: 400 });
  }

  try {
    const headers: HeadersInit = { 'Accept': 'application/json' };
    
    const response = await fetch(apiUrl, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Error fetching from ${apiUrl}: ${response.status} ${response.statusText}`, errorBody);
      return NextResponse.json({ error: `Failed to fetch data for type '${type}': ${response.statusText}`, data: [] }, { status: 200 });
    }
    
    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in API route for ${apiUrl}:`, error);
    return NextResponse.json({ error: 'Internal Server Error while fetching ' + type, data: [] }, { status: 200 });
  }
}
