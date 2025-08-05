
import { NextResponse, type NextRequest } from 'next/server';
import { chromium } from 'playwright-core';
import os from 'os';

export const dynamic = 'force-dynamic';

const API_ENDPOINTS = {
  'live': 'https://streamed.pk/api/matches/live',
  'all-today': 'https://streamed.pk/api/matches/all-today',
  'sports': 'https://streamed.pk/api/sports',
  'stream': 'https://streamed.pk/api/stream',
  'streamtp': 'https://streamtpglobal.com/eventos.json',
  'tc-chaser': 'https://tc-chaser.vercel.app/api/events',
  'agenda': 'https://agenda-dpt.vercel.app/api/events',
};

// Helper function to use a headless browser for fetching data from protected endpoints
async function fetchWithBrowser(url: string) {
  let browser = null;
  try {
    const executablePath = os.platform() === 'linux' 
      ? '/usr/bin/google-chrome' 
      : undefined;

    browser = await chromium.launch({ 
        headless: true,
        executablePath,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const context = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' });
    const page = await context.newPage();
    
    const response = await page.goto(url, { waitUntil: 'domcontentloaded' });

    if (!response || !response.ok()) {
      throw new Error(`Request failed with status ${response?.status()}`);
    }
    
    // The content is usually in a <pre> tag or the body itself
    const content = await page.textContent('body');
    if (!content) {
        throw new Error('No content found on the page');
    }

    try {
        return JSON.parse(content);
    } catch(e) {
        // Fallback for pages that might have the JSON inside a <pre> tag
        const preContent = await page.textContent('pre');
        if(preContent) {
            return JSON.parse(preContent);
        }
        throw new Error('Failed to parse JSON content from page.');
    }

  } catch (error) {
    console.error(`Error fetching with browser from ${url}:`, error);
    return []; // Return empty array on failure to avoid breaking the frontend
  } finally {
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
  
  const isStreamedPkEndpoint = type === 'live' || type === 'all-today' || type === 'sports';

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
    let data;
    if (isStreamedPkEndpoint) {
        data = await fetchWithBrowser(apiUrl);
    } else {
        const response = await fetch(apiUrl, {
            headers: { 'Accept': 'application/json' },
            next: { revalidate: 1800 }, // Cache for 30 minutes
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error fetching from ${apiUrl}: ${response.status} ${response.statusText}`, {errorBody});
            return NextResponse.json([], { status: 200 });
        }
        data = await response.json();
    }
    
    if (!Array.isArray(data)) {
        console.warn(`API for type '${type}' did not return an array. Returning empty array instead.`);
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error(`Error in API route for ${apiUrl}:`, error);
    return NextResponse.json([], { status: 200 });
  }
}
