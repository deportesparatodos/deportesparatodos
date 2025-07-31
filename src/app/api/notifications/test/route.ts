
import { NextResponse, type NextRequest } from 'next/server';
import { Resend } from 'resend';
import type { Event } from '@/components/event-carousel';

const resend = new Resend(process.env.RESEND_API_KEY);

interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number;
}

const fetchAllEvents = async (): Promise<Event[]> => {
    try {
        const [liveResponse, todayResponse, sportsResponse] = await Promise.all([
            fetch('https://streamed.su/api/matches/live').then(res => res.json()),
            fetch('https://streamed.su/api/matches/all-today').then(res => res.json()),
            fetch('https://streamed.su/api/sports').then(res => res.json())
        ]);
        
        const liveData: StreamedMatch[] = Array.isArray(liveResponse) ? liveResponse : [];
        const todayData: StreamedMatch[] = Array.isArray(todayResponse) ? todayResponse : [];
        const sportsData: {id: string, name: string}[] = Array.isArray(sportsResponse) ? sportsResponse : [];

        const allMatchesMap = new Map<string, StreamedMatch>();
        todayData.forEach(match => allMatchesMap.set(match.id, match));
        liveData.forEach(match => allMatchesMap.set(match.id, match));

        const categoryMap = sportsData.reduce<Record<string, string>>((acc, sport) => {
            acc[sport.id] = sport.name;
            return acc;
        }, {});
        
        return Array.from(allMatchesMap.values()).map(match => ({
            title: match.title,
            time: new Date(match.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }),
            category: categoryMap[match.category] || match.category,
            status: liveData.some(liveMatch => liveMatch.id === match.id) ? 'En Vivo' : 'Próximo',
            options: [],
            sources: [],
            buttons: [],
            language: '',
            date: new Date(match.date).toISOString().split('T')[0],
            source: 'streamed.su',
        }));
    } catch (error) {
        console.error("Error fetching events for test email:", error);
        return [];
    }
};

const generateEmailHtml = (eventsByCategory: Record<string, Event[]>) => {
    let detailsHtml = `
      <p style="margin-bottom: 20px;">Este es un ejemplo de cómo recibirás tus notificaciones diarias basado en tu selección actual.</p>
    `;
    if (Object.keys(eventsByCategory).length === 0) {
        detailsHtml += "<p>No hay eventos programados para hoy que coincidan con tu selección.</p>";
    } else {
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


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, subscribedCategories } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!subscribedCategories) {
      return NextResponse.json({ error: 'subscribedCategories is required' }, { status: 400 });
    }

    const allEvents = await fetchAllEvents();

    const userEvents = subscribedCategories.includes('all')
      ? allEvents
      : allEvents.filter((event: Event) => subscribedCategories.includes(event.category));
    
    const eventsByCategory = userEvents.reduce<Record<string, Event[]>>((acc, event) => {
        if (!acc[event.category]) {
            acc[event.category] = [];
        }
        acc[event.category].push(event);
        return acc;
    }, {});


    const emailHtml = generateEmailHtml(eventsByCategory);

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
