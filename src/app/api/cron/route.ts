
import { NextResponse } from 'next/server';
import type { Event } from '@/components/event-carousel';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic'; 

// NOTE: This CRON job is currently disabled because there is no central database
// to fetch user subscriptions from since Vercel KV has been removed.
// It is kept in place to avoid breaking deployments, but it will not send emails.

export async function GET() {
  try {
    return NextResponse.json({ message: "Cron job executed, but no database is configured to fetch subscriptions." });

  } catch (error) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
