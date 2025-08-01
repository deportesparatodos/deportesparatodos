
import { NextResponse } from 'next/server';
import type { Event } from '@/components/event-carousel';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic'; 

interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number;
}

// NOTE: This CRON job is currently disabled because there is no central database
// to fetch user subscriptions from since Vercel KV has been removed.
// The logic for fetching events and generating email HTML is kept for future use
// if a database is reintroduced.

const normalizeCategory = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'football' || lowerCategory === 'fútbol' || lowerCategory === 'fútbol_cup') {
        return 'Fútbol';
    }
    return category;
};

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
            category: normalizeCategory(categoryMap[match.category] || match.category),
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
    // With the removal of Vercel KV, there is no central database to get subscriptions from.
    // This cron job will therefore not send any emails.
    // It is kept in place to avoid breaking deployments, and can be reactivated if a new database solution is implemented.
    return NextResponse.json({ message: "Cron job executed, but no database is configured to fetch subscriptions." });

  } catch (error) {
    console.error('CRON Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
