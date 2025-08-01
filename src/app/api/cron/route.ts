
import { NextResponse } from 'next/server';
import mailchimp from '@mailchimp/mailchimp_marketing';
import { format, toZonedTime } from 'date-fns-tz';
import { parse, isValid } from 'date-fns';

export const dynamic = 'force-dynamic'; 

// --- Mailchimp Configuration ---
if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_SERVER_PREFIX) {
    mailchimp.setConfig({
        apiKey: process.env.MAILCHIMP_API_KEY,
        server: process.env.MAILCHIMP_SERVER_PREFIX,
    });
}

// --- Event Fetching and Processing Logic (mirrors /api/notifications/test) ---

interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number;
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

// --- Main CRON Job Logic ---
export async function GET() {
  if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX || !process.env.MAILCHIMP_AUDIENCE_ID) {
    console.error('Mailchimp API Key, Server Prefix or Audience ID are not configured.');
    return NextResponse.json({ error: 'Mailchimp configuration is incomplete.' }, { status: 500 });
  }

  try {
    console.log("CRON Job Started: Fetching subscribers...");
    
    // 1. Get all subscribers from the Mailchimp audience
    const subscribersResponse = await mailchimp.lists.getListMembersInfo(process.env.MAILCHIMP_AUDIENCE_ID, {
        count: 1000, // Adjust count as needed
        status: 'subscribed',
    });

    const subscribers = subscribersResponse.members;
    if (!subscribers || subscribers.length === 0) {
      console.log("No subscribers found. Cron job finished.");
      return NextResponse.json({ message: "No subscribers to email." });
    }

    console.log(`Found ${subscribers.length} subscribers. Processing emails.`);
    
    const emailPromises = subscribers.map(async (subscriber) => {
      const email = subscriber.email_address;
      const tags = subscriber.tags.map(tag => tag.name);
      const categories = tags.length > 0 ? tags : ['all'];
      const isAllCategories = categories.includes('all');

      // 2. Get events based on subscriber's preferences
      const events = await getEventsForNotification(categories);
      
      // Don't send an email if there are no events for their categories
      if (events.length === 0) {
        console.log(`No events for ${email}. Skipping.`);
        return { email, status: 'skipped', reason: 'No events' };
      }

      // 3. Generate personalized email content
      const emailHtml = generateEmailHtml(events, isAllCategories);
      const subject = `¡Hay ${events.length} eventos para ti hoy!`;

      try {
        // 4. Create and send a unique campaign for this subscriber
        const campaign = await mailchimp.campaigns.create({
            type: 'regular',
            recipients: {
                list_id: process.env.MAILCHIMP_AUDIENCE_ID,
                segment_opts: {
                    match: 'all',
                    conditions: [{
                        condition_type: 'EmailAddress',
                        field: 'EMAIL',
                        op: 'is',
                        value: email,
                    }]
                }
            },
            settings: {
                subject_line: subject,
                preview_text: 'Tus eventos seleccionados para hoy.',
                title: `Notificación Diaria - ${email} - ${new Date().toISOString()}`,
                from_name: 'Deportes Para Todos',
                reply_to: 'no-reply@deportesparatodos.com',
                auto_footer: true,
            },
        });

        const campaignId = campaign.id;
        
        await mailchimp.campaigns.setContent(campaignId, { html: emailHtml });
        await mailchimp.campaigns.send(campaignId);

        console.log(`Email sent successfully to ${email}.`);
        return { email, status: 'success' };
      } catch (sendError: any) {
        console.error(`Failed to send email to ${email}:`, sendError.response?.body || sendError);
        return { email, status: 'failed', error: sendError.response?.body?.detail || 'Unknown send error' };
      }
    });

    const results = await Promise.all(emailPromises);

    return NextResponse.json({ 
        message: "Cron job executed.",
        results,
    });

  } catch (error: any) {
    console.error('CRON Error:', error.response?.body || error);
    return NextResponse.json({ error: 'Internal Server Error during CRON execution' }, { status: 500 });
  }
}

    