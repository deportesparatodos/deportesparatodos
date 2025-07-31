
import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import type { Event } from '@/components/event-carousel';

const resend = new Resend(process.env.RESEND_API_KEY);

const generateEmailHtml = (eventsByCategory: Record<string, Event[]>) => {
    let detailsHtml = `
      <p style="margin-bottom: 20px;">Este es un ejemplo de cómo recibirás tus notificaciones diarias.</p>
    `;
    for (const category in eventsByCategory) {
        const events = eventsByCategory[category];
        let eventsHtml = '';
        events.forEach(event => {
            eventsHtml += `<li><strong>${event.time}</strong> - ${event.title}</li>`;
        });
        
        detailsHtml += `
            <details open style="margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
                <summary style="padding: 10px; background-color: #f5f5f5; font-weight: bold; cursor: pointer;">
                    ${category} (${events.length} eventos)
                </summary>
                <ul style="padding: 10px 10px 10px 30px; margin: 0; list-style-type: disc;">
                    ${eventsHtml}
                </ul>
            </details>
        `;
    }

    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
            <h1 style="color: #333; text-align: center;">Notificación de Prueba - Deportes para Todos</h1>
            ${detailsHtml}
            <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
                Para dejar de recibir estas notificaciones, gestiona tus suscripciones en la web.
            </p>
        </div>
    `;
};

const createSampleEvents = (): Record<string, Event[]> => {
    return {
        "Motor Sports": [
            {
                title: "Formula 1: Gran Premio de Monza",
                time: "09:00",
                category: "Motor Sports",
                status: 'Próximo', options: [], sources: [], buttons: [], language: '', date: '', source: ''
            },
            {
                title: "MotoGP: Carrera de Cataluña",
                time: "11:00",
                category: "Motor Sports",
                status: 'Próximo', options: [], sources: [], buttons: [], language: '', date: '', source: ''
            }
        ],
        "Futbol": [
            {
                title: "River Plate vs Boca Juniors",
                time: "17:00",
                category: "Futbol",
                status: 'Próximo', options: [], sources: [], buttons: [], language: '', date: '', source: ''
            }
        ]
    };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const sampleEvents = createSampleEvents();
    const emailHtml = generateEmailHtml(sampleEvents);

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `🔔 Notificación de Prueba de Deportes para Todos`,
      html: emailHtml,
    });

    return NextResponse.json({ message: 'Test notification sent successfully' });

  } catch (error: any) {
    console.error('TEST_NOTIFICATION Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
