
import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import type { Subscription } from '@/components/notification-manager';
import type { Event } from '@/components/event-carousel';

export const dynamic = 'force-dynamic'; 

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
        console.error("Error fetching events:", error);
        return [];
    }
};

const generateEmailHtml = (eventsByCategory: Record<string, Event[]>) => {
    let detailsHtml = '';
    for (const category in eventsByCategory) {
        const events = eventsByCategory[category];
        let eventsHtml = '';
        events.forEach(event => {
            eventsHtml += `<li><strong>${event.time}</strong> - ${event.title}</li>`;
        });
        
        detailsHtml += `
            <details style="margin-bottom: 10px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden;">
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
            <h1 style="color: #333; text-align: center;">Tus Eventos del Día en Deportes para Todos</h1>
            <p>Hola, aquí tienes el resumen de los eventos de hoy según tus suscripciones:</p>
            ${detailsHtml}
            <p style="text-align: center; font-size: 12px; color: #888; margin-top: 20px;">
                Para dejar de recibir estas notificaciones, gestiona tus suscripciones en la web.
            </p>
        </div>
    `;
};

export async function GET() {
  try {
    const allEvents = await fetchAllEvents();
    if (allEvents.length === 0) {
      return NextResponse.json({ message: "No events found, skipping notifications." });
    }

    const subscriptionKeys = [];
    let cursor = 0;
    do {
      const [nextCursor, keys] = await kv.scan(cursor, { match: 'subscription:*' });
      cursor = nextCursor;
      subscriptionKeys.push(...keys);
    } while (cursor !== 0);

    if (subscriptionKeys.length === 0) {
        return NextResponse.json({ message: "No subscriptions found." });
    }

    const subscriptions: (Subscription | null)[] = await kv.mget(...subscriptionKeys);
    const validSubscriptions = subscriptions.filter((s): s is Subscription => s !== null);

    const emailsToSend: { to: string; html: string, subject: string }[] = [];

    for (const sub of validSubscriptions) {
        const userEvents = sub.subscribedCategories.includes('all')
            ? allEvents
            : allEvents.filter(event => sub.subscribedCategories.includes(event.category));

        if (userEvents.length > 0) {
            const eventsByCategory = userEvents.reduce<Record<string, Event[]>>((acc, event) => {
                if (!acc[event.category]) {
                    acc[event.category] = [];
                }
                acc[event.category].push(event);
                return acc;
            }, {});

            const emailHtml = generateEmailHtml(eventsByCategory);
            emailsToSend.push({
                to: sub.email,
                subject: `📅 Tus eventos para hoy en Deportes para Todos`,
                html: emailHtml,
            });
        }
    }

    if (emailsToSend.length > 0) {
        await Promise.all(emailsToSend.map(email => resend.emails.send({
            from: 'onboarding@resend.dev',
            ...email
        })));
    }

    return NextResponse.json({ message: `Processed ${validSubscriptions.length} subscriptions and sent ${emailsToSend.length} emails.` });

  } catch (error) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
