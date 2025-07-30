
import { kv } from '@vercel/kv';
import { NextResponse, type NextRequest } from 'next/server';

// Unique key for storing all subscriptions in one KV entry
const SUBSCRIPTIONS_KEY = 'dpt_all_subscriptions';

interface SubscriptionData {
  pushoverEmail: string;
  subscriptions: any[]; // Define a proper type for Subscription if you have one
}

export const dynamic = 'force-dynamic';

// GET all subscriptions for a given Pushover email
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pushoverEmail = searchParams.get('email');

  if (!pushoverEmail) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  }

  try {
    const allData: Record<string, SubscriptionData> | null = await kv.get(SUBSCRIPTIONS_KEY);
    const userData = allData ? allData[pushoverEmail] : null;

    if (!userData) {
      return NextResponse.json({ pushoverEmail: pushoverEmail, subscriptions: [] }, { status: 200 });
    }

    return NextResponse.json(userData, { status: 200 });
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json({ error: 'Failed to retrieve subscriptions' }, { status: 500 });
  }
}

// POST to add or update subscriptions for a Pushover email
export async function POST(request: NextRequest) {
  try {
    const body: SubscriptionData = await request.json();
    const { pushoverEmail, subscriptions } = body;

    if (!pushoverEmail || !subscriptions) {
      return NextResponse.json({ error: 'pushoverEmail and subscriptions are required' }, { status: 400 });
    }
    
    // Use a transaction to safely update the nested structure
    const allData: Record<string, SubscriptionData> | null = await kv.get(SUBSCRIPTIONS_KEY);
    const newData = { ...allData, [pushoverEmail]: { pushoverEmail, subscriptions } };
    
    await kv.set(SUBSCRIPTIONS_KEY, newData);

    return NextResponse.json({ success: true, data: { pushoverEmail, subscriptions } }, { status: 200 });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json({ error: 'Failed to save subscriptions' }, { status: 500 });
  }
}
