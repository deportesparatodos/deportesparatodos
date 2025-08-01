
import { NextResponse, type NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import type { Subscription } from '@/components/notification-manager';

export const dynamic = 'force-dynamic';

const getSubscriptionKey = (email: string) => `subscription:${email}`;

// GET subscription by email
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const subscription: Subscription | null = await kv.get(getSubscriptionKey(email));
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    return NextResponse.json(subscription);
  } catch (error) {
    console.error('KV GET Error:', error);
    const errorMessage = (error instanceof Error && error.message.includes("Missing required environment variables"))
      ? "El servicio de base de datos no está configurado."
      : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// POST to create or update a subscription
export async function POST(request: NextRequest) {
  try {
    const body: Subscription = await request.json();
    const { email, subscribedCategories } = body;

    if (!email || !subscribedCategories) {
      return NextResponse.json({ error: 'Email and subscribedCategories are required' }, { status: 400 });
    }

    const subscription: Subscription = { email, subscribedCategories };
    
    // The key now includes the email to be unique
    await kv.set(getSubscriptionKey(email), subscription);
    
    return NextResponse.json({ message: 'Subscription saved successfully' }, { status: 200 });

  } catch (error) {
    console.error('KV SET Error:', error);
    const errorMessage = (error instanceof Error && error.message.includes("Missing required environment variables"))
      ? "El servicio de base de datos no está configurado. No se pudieron guardar las preferencias."
      : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
