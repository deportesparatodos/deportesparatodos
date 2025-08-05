
import { NextResponse, type NextRequest } from 'next/server';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import os from 'os';

export const dynamic = 'force-dynamic';

puppeteer.use(StealthPlugin());

const API_ENDPOINTS = {
  'live': 'https://streamed.pk/api/matches/live',
  'all-today': 'https://streamed.pk/api/matches/all-today',
  'sports': 'https://streamed.pk/api/sports',
  'stream': 'https://streamed.pk/api/stream',
  'streamtp': 'https://streamtpglobal.com/eventos.json',
  'tc-chaser': 'https://tc-chaser.vercel.app/api/events',
  'agenda': 'https://agenda-dpt.vercel.app/api/events',
};

/**
 * Fetches content from a URL using a headless browser (Puppeteer)
 * to bypass anti-bot measures like Cloudflare's JS challenge.
 * @param url The URL to scrape.
 * @returns The parsed JSON object from the page, or null if an error occurs.
 */
async function fetchWithBrowser(url: string) {
  let browser = null;
  try {
    // Launch the browser instance using puppeteer-extra.
    // It will use the stealth plugin to appear more like a real user.
    browser = await puppeteer.launch({ 
        headless: true,
        // Recommended args for running in a server/container environment
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    
    // Set a common user agent to appear more like a standard browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the URL and wait for the network to be idle, which is a good
    // indicator that all dynamic content has loaded, including resolving Cloudflare challenges.
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Extract the text content from the body of the page.
    const content = await page.evaluate(() => document.body.textContent);

    if (!content) {
        throw new Error('No content found on the page');
    }

    // The content is expected to be a JSON string. Parse it.
    try {
        return JSON.parse(content);
    } catch(e) {
        // As a fallback, some sites might wrap their JSON in a <pre> tag.
        const preContent = await page.evaluate(() => document.querySelector('pre')?.textContent);
        if(preContent) {
            try {
                return JSON.parse(preContent);
            } catch (preError) {
                console.error(`Failed to parse <pre> content from ${url}:`, preError);
                throw new Error('Failed to parse JSON content from <pre> tag.');
            }
        }
        // If parsing still fails, throw an error.
        throw new Error('Failed to parse JSON content from page body.');
    }

  } catch (error) {
    // Log any errors that occur during the process for debugging.
    console.error(`Error fetching with Puppeteer from ${url}:`, error);
    return null; // Return null to indicate failure.
  } finally {
    // CRUCIAL: Always close the browser instance to free up resources.
    // The 'finally' block ensures this happens even if an error is thrown.
    if (browser) {
      await browser.close();
    }
  }
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as keyof typeof API_ENDPOINTS;
  
  if (!type) {
    return NextResponse.json({ error: '`type` parameter is required' }, { status: 400 });
  }
  
  const isStreamedPkEndpoint = type === 'live' || type === 'all-today' || type === 'sports' || type === 'stream';

  // Handle specific stream requests (e.g., /api/streams?type=stream&source=xxx&id=yyy)
  if (type === 'stream') {
    const source = searchParams.get('source');
    const id = searchParams.get('id');

    if (!source || !id) {
      return NextResponse.json({ error: '`source` and `id` are required for type=stream' }, { status: 400 });
    }
    
    const apiUrl = `${API_ENDPOINTS.stream}/${source}/${id}`;
    
    try {
      const data = await fetchWithBrowser(apiUrl);
      // If data is null (due to an error in fetchWithBrowser), return an empty array
      return NextResponse.json(data || []);
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
    let data;
    // Use the browser-based fetcher for Cloudflare-protected endpoints
    if (isStreamedPkEndpoint) {
        data = await fetchWithBrowser(apiUrl);
    } else {
        // Use a standard fetch for unprotected endpoints
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 1800 }, // Cache for 30 minutes
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error fetching from ${apiUrl}: ${response.status} ${response.statusText}`, {errorBody});
            // Return empty array on failure to prevent frontend errors
            return NextResponse.json([], { status: 200 });
        }
        data = await response.json();
    }
    
    // Ensure the data is an array, or return an empty one if not or if it's null
    if (!Array.isArray(data)) {
        console.warn(`API for type '${type}' did not return a valid array. Returning empty array instead.`);
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in API route for ${apiUrl}:`, error);
    // Return empty array on failure to prevent frontend errors
    return NextResponse.json([], { status: 200 });
  }
}
