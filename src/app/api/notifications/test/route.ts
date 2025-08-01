
import { NextResponse, type NextRequest } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';

export const dynamic = 'force-dynamic';

// Initialize Mailchimp
if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX) {
    mailchimp.setConfig({
        apiKey: process.env.MAILCHIMP_API_KEY,
        server: process.env.MAILCHIMP_SERVER_PREFIX,
    });
}

// Helper function to find or create a test campaign
async function findOrCreateTestCampaign(audienceId: string) {
    try {
        const { campaigns } = await mailchimp.campaigns.list({
            status: 'save', // 'save' means draft
            count: 100,
        });

        const existingTestCampaign = campaigns.find(c => c.settings?.title === 'DPT Test Campaign');

        if (existingTestCampaign) {
            return existingTestCampaign.id;
        }

        // If no test campaign exists, create one
        const newCampaign = await mailchimp.campaigns.create({
            type: 'regular',
            recipients: { list_id: audienceId },
            settings: {
                subject_line: 'Correo de Prueba - Deportes Para Todos',
                preview_text: 'Este es un correo de prueba.',
                title: 'DPT Test Campaign',
                from_name: 'Deportes Para Todos',
                reply_to: 'no-reply@deportesparatodos.com',
                auto_footer: true,
            },
        });
        
        // Add content to the campaign
        await mailchimp.campaigns.setContent(newCampaign.id, {
            plain_text: 'Este es un correo de prueba para verificar la configuración de Mailchimp.',
            html: `<h1>¡Hola!</h1><p>Este es un correo de prueba desde la aplicación Deportes Para Todos para verificar que la configuración de Mailchimp funciona correctamente.</p>`
        });


        return newCampaign.id;

    } catch (error: any) {
        console.error('Mailchimp findOrCreateTestCampaign error:', error.response?.body || error);
        throw new Error('No se pudo encontrar o crear la campaña de prueba en Mailchimp.');
    }
}


export async function POST(request: NextRequest) {
    const { email } = await request.json();

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX || !process.env.MAILCHIMP_AUDIENCE_ID) {
        console.error('Mailchimp API Key, Server Prefix or Audience ID are not configured.');
        return NextResponse.json({ error: 'La configuración del servidor de correo está incompleta.' }, { status: 500 });
    }

    try {
        const campaignId = await findOrCreateTestCampaign(process.env.MAILCHIMP_AUDIENCE_ID);

        // Send the test email
        await mailchimp.campaigns.sendTestEmail(campaignId, {
            test_emails: [email],
            send_type: 'html',
        });

        return NextResponse.json({ message: `Correo de prueba enviado a ${email}` });

    } catch (error: any) {
        console.error('Mailchimp sendTestEmail Error:', error.response?.body || error);
        return NextResponse.json(
            { error: 'Ocurrió un error al enviar el correo de prueba. Verifica la configuración de Mailchimp.' },
            { status: 500 }
        );
    }
}
