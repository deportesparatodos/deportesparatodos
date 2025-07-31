
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@vercel/kv';
import type { Subscription } from '@/components/notification-manager';

export const dynamic = 'force-dynamic';

// GET subscription by email
export async function GET(request: NextRequest) {
  const kv = createClient({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
  });
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const subscription: Subscription | null = await kv.get(`subscription:${email}`);
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST to create or update a subscription
export async function POST(request: NextRequest) {
  const kv = createClient({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
  });
  try {
    const body: Subscription = await request.json();
    const { email, subscribedCategories } = body;

    if (!email || !subscribedCategories) {
      return NextResponse.json({ error: 'Email and subscribedCategories are required' }, { status: 400 });
    }

    const subscription: Subscription = { email, subscribedCategories };
    await kv.set(`subscription:${email}`, subscription);
    
    return NextResponse.json({ message: 'Subscription saved successfully' }, { status: 200 });

  } catch (error) {
    console.error('KV SET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
