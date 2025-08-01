
import { NextResponse, type NextRequest } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const dynamic = 'force-dynamic';

// Initialize Mailchimp
mailchimp.setConfig({
  apiKey: process.env.MAILCHIMP_API_KEY,
  server: process.env.MAILCHIMP_SERVER_PREFIX,
});

export async function POST(request: NextRequest) {
  const { email, tags = [] } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_AUDIENCE_ID) {
    console.error('Mailchimp API Key or Audience ID are not configured.');
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  try {
    // Add or update the subscriber
    const response = await mailchimp.lists.setListMember(
      process.env.MAILCHIMP_AUDIENCE_ID,
      email.toLowerCase(),
      {
        email_address: email,
        status_if_new: 'subscribed',
        tags: tags,
      }
    );

    return NextResponse.json({
      message: 'Successfully subscribed!',
      subscriberId: response.id,
    });

  } catch (error: any) {
    console.error('Mailchimp API Error:', error.response?.body || error.message);
    
    // Provide a more user-friendly error message
    if (error.status === 400) {
        return NextResponse.json({ error: 'Correo electrónico inválido. Por favor, verifica la dirección.' }, { status: 400 });
    }
    
    return NextResponse.json(
        { error: 'An error occurred during the subscription process.' },
        { status: 500 }
    );
  }
}
