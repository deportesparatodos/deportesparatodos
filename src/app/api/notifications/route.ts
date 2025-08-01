
import { NextResponse, type NextRequest } from 'next/server';

// This endpoint is now a mock endpoint.
// The primary storage for notification settings is the browser's localStorage.
// This API call is kept to maintain the existing frontend structure without breaking it,
// but it no longer interacts with a database like Vercel KV.

export const dynamic = 'force-dynamic';

// GET subscription by email - MOCK
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  // Since we are not using a database, we cannot retrieve subscriptions on the server.
  // We return a not found error, but the client should rely on localStorage.
  return NextResponse.json({ error: 'Subscription check is handled client-side.' }, { status: 404 });
}

// POST to create or update a subscription - MOCK
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subscribedCategories } = body;

    if (!email || !subscribedCategories) {
      return NextResponse.json({ error: 'Email and subscribedCategories are required' }, { status: 400 });
    }

    // This endpoint now successfully does nothing. The data is already saved in the client's localStorage.
    // By returning a success message, we confirm to the frontend that the "save" operation is complete.
    return NextResponse.json({ message: 'Subscription saved successfully' }, { status: 200 });

  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
