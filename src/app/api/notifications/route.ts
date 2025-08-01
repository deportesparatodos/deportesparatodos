
import { NextResponse, type NextRequest } from 'next/server';

// This endpoint is no longer in use and has been replaced by /api/subscribe
// It is kept to prevent breaking any old references but performs no action.

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'This endpoint is deprecated. Please use /api/subscribe.' }, { status: 410 });
}

export async function GET(request: NextRequest) {
    return NextResponse.json({ message: 'This endpoint is deprecated.' }, { status: 410 });
}
