
import { NextResponse, type NextRequest } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { format, toZonedTime } from 'date-fns-tz';
import { parse, isValid } from 'date-fns';


export const dynamic = 'force-dynamic';

if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX) {
    mailchimp.setConfig({
        apiKey: process.env.MAILCHIMP_API_KEY,
        server: process.env.MAILCHIMP_SERVER_PREFIX,
    });
}

// --- Event Fetching Logic (simplified, mirrors page logic) ---

interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number; // Timestamp
  sources: { source: string; id: string }[];
}

interface Event {
    title: string;
    time: string;
    category: string;
    status: string;
}

const normalizeCategory = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'football' || lowerCategory === 'fútbol' || lowerCategory === 'fútbol_cup') {
        return 'Fútbol';
    }
    const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
    return capitalized;
};


async function getEventsForNotification(categories: string[]): Promise<Event[]> {
    try {
        const [liveResponse, todayResponse, sportsResponse] = await Promise.all([
            fetch('https://streamed.su/api/matches/live').then(res => res.ok ? res.json() : []).catch(() => []),
            fetch('https://streamed.su/api/matches/all-today').then(res => res.ok ? res.json() : []).catch(() => []),
            fetch('https://streamed.su/api/sports').then(res => res.ok ? res.json() : []).catch(() => []),
        ]);

        const liveData: StreamedMatch[] = Array.isArray(liveResponse) ? liveResponse : [];
        const todayData: StreamedMatch[] = Array.isArray(todayResponse) ? todayResponse : [];
        const sportsData: {id: string; name: string}[] = Array.isArray(sportsResponse) ? sportsResponse : [];

        const categoryMap = sportsData.reduce<Record<string, string>>((acc, sport) => {
            acc[sport.id] = sport.name;
            return acc;
        }, {});
        
        const allMatchesMap = new Map<string, StreamedMatch>();
        todayData.forEach(match => allMatchesMap.set(match.id, match));
        liveData.forEach(match => allMatchesMap.set(match.id, match));
        
        const combinedData = Array.from(allMatchesMap.values());
        const timeZone = 'America/Argentina/Buenos_Aires';

        const allEvents: Event[] = combinedData.map((match: StreamedMatch) => {
            const isLive = liveData.some(liveMatch => liveMatch.id === match.id);
            const zonedEventTime = toZonedTime(new Date(match.date), timeZone);
            
            return {
              title: match.title,
              time: format(zonedEventTime, 'HH:mm'),
              category: normalizeCategory(categoryMap[match.category] || match.category),
              status: isLive ? 'En Vivo' : 'Próximo',
            };
        });
        
        // Filter events based on selected categories
        const userCategories = new Set(categories.map(c => c.toLowerCase()));
        const activeEvents = allEvents.filter(e => e.status === 'En Vivo' || e.status === 'Próximo');

        if (userCategories.has('all')) {
            return activeEvents;
        }

        return activeEvents.filter(event => 
            userCategories.has(event.category.toLowerCase())
        );

    } catch (error) {
        console.error("Error fetching events for notification:", error);
        return [];
    }
}

const sortLogic = (a: Event, b: Event): number => {
    const timeAIsUnknown = a.time === '--:--' || a.status === 'Desconocido' || !isValid(parse(a.time, 'HH:mm', new Date()));
    const timeBIsUnknown = b.time === '--:--' || b.status === 'Desconocido' || !isValid(parse(b.time, 'HH:mm', new Date()));

    if (timeAIsUnknown && !timeBIsUnknown) return 1;
    if (!timeAIsUnknown && timeBIsUnknown) return -1;
    if (timeAIsUnknown && timeBIsUnknown) return a.title.localeCompare(b.title);
    
    // Sort chronologically from 00:00 to 23:59
    const timeA = parse(a.time, 'HH:mm', new Date()).getTime();
    const timeB = parse(b.time, 'HH:mm', new Date()).getTime();

    return timeA - timeB;
};


function generateEmailHtml(events: Event[], isAllCategories: boolean): string {
    if (events.length === 0) {
        return `
            <h1>Eventos de Hoy</h1>
            <p>No hay eventos programados para hoy en tus categorías seleccionadas.</p>
            <p>Puedes ajustar tus preferencias en cualquier momento en la aplicación.</p>
        `;
    }
    
    let eventListHtml = '';

    if (isAllCategories) {
        // Single list for all events
        const sortedEvents = [...events].sort(sortLogic);
        eventListHtml = sortedEvents.map(event => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p style="margin: 0; font-size: 16px;">
                    <strong>${event.title}</strong>
                    <span style="color: #718096; font-weight: bold; margin-left: 10px;">
                        ${event.time}
                    </span>
                </p>
                <p style="margin: 5px 0 0; font-size: 14px; color: #555;">${event.category}</p>
            </div>
        `).join('');

    } else {
        // Group events by category in collapsible sections
        const groupedEvents = events.reduce<Record<string, Event[]>>((acc, event) => {
            const category = event.category || 'Otros';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(event);
            return acc;
        }, {});

        eventListHtml = Object.entries(groupedEvents)
            .map(([category, categoryEvents]) => {
                
                const sortedEvents = [...categoryEvents].sort(sortLogic);

                const eventsHtml = sortedEvents
                    .map(event => `
                        <div style="border-bottom: 1px solid #eee; padding: 10px 0; margin-left: 20px;">
                            <p style="margin: 0; font-size: 16px;">
                                <strong>${event.title}</strong>
                                <span style="color: #718096; font-weight: bold; margin-left: 10px;">
                                    ${event.time}
                                </span>
                            </p>
                        </div>
                    `)
                    .join('');

                return `
                    <div style="margin-top: 20px;">
                        <details>
                            <summary style="padding: 15px; background-color: #f7f7f7; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                               <h1 style="margin: 0; font-size: 18px; font-weight: bold; display: inline;">${category} (${sortedEvents.length})</h1>
                            </summary>
                            ${eventsHtml}
                        </details>
                    </div>
                `;
            })
            .join('');
    }


    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Deportes para Todos</h1>
            </div>
            <div style="padding: 20px;">
                <h2 style="color: #333;">Aquí están los eventos de hoy en tus categorías:</h2>
                ${eventListHtml}
            </div>
            <div style="background-color: #f7f7f7; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                <p>Para dejar de recibir estas notificaciones, puedes gestionar tus suscripciones en la aplicación.</p>
            </div>
        </div>
    `;
}


export async function POST(request: NextRequest) {
    const { email, categories = ['all'] } = await request.json();

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX || !process.env.MAILCHIMP_AUDIENCE_ID) {
        console.error('Mailchimp API Key, Server Prefix or Audience ID are not configured.');
        return NextResponse.json({ error: 'La configuración del servidor de correo está incompleta.' }, { status: 500 });
    }

    try {
        const events = await getEventsForNotification(categories);
        const isAllCategories = categories.includes('all');
        const emailHtml = generateEmailHtml(events, isAllCategories);

        const subject = events.length > 0
            ? `¡Hay ${events.length} eventos para ti hoy!`
            : 'Resumen de eventos de hoy';
        
        // 1. Create a new campaign
        const campaign = await mailchimp.campaigns.create({
            type: 'regular',
            recipients: {
                list_id: process.env.MAILCHIMP_AUDIENCE_ID,
            },
            settings: {
                subject_line: `[Prueba] ${subject}`,
                preview_text: 'Tus eventos seleccionados para hoy.',
                title: `Prueba DPT - ${email} - ${new Date().toISOString()}`,
                from_name: 'Deportes Para Todos',
                reply_to: 'no-reply@deportesparatodos.com',
                auto_footer: true,
            },
        });

        const campaignId = campaign.id;

        // 2. Set the content of the campaign
        await mailchimp.campaigns.setContent(campaignId, {
            html: emailHtml,
        });

        // 3. Send the test email
        await mailchimp.campaigns.sendTestEmail(campaignId, {
            test_emails: [email],
            send_type: 'html',
        });
        
        // 4. (Optional but recommended) Delete the one-time campaign after sending
        // We'll leave it for now for debugging, but in production you might want to clean up.
        // await mailchimp.campaigns.remove(campaignId);


        return NextResponse.json({ message: `Correo de prueba enviado a ${email}.` });

    } catch (error: any) {
        console.error('Mailchimp sendTestEmail Error:', error.response?.body || error);
        const errorMessage = error.response?.body?.detail || 'Ocurrió un error al enviar el correo de prueba.';
        return NextResponse.json(
            { error: errorMessage },
            { status: 500 }
        );
    }
}
