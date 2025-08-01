
import { NextResponse, type NextRequest } from 'next/server';

// This endpoint is no longer in use.
// Email testing should be done via the email provider's platform (e.g., Mailchimp).

export async function POST(request: NextRequest) {
    return NextResponse.json({ message: 'This endpoint is deprecated. Please test emails from your provider.' }, { status: 410 });
}
