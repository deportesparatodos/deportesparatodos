
import { NextResponse } from 'next/server';
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
            fetch('https://streamed.pk/api/matches/live').then(res => res.ok ? res.json() : []).catch(() => []),
            fetch('https://streamed.pk/api/matches/all-today').then(res => res.ok ? res.json() : []).catch(() => []),
            fetch('https://streamed.pk/api/sports').then(res => res.ok ? res.json() : []).catch(() => []),
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

function generateEmailHtml(events: Event[], isAllCategories: boolean, categoryName?: string): string {
    if (events.length === 0) {
        return `
            <h1>Eventos de Hoy</h1>
            <p>No hay eventos programados para hoy en tus categorías seleccionadas.</p>
            <p>Puedes ajustar tus preferencias en cualquier momento en la aplicación.</p>
        `;
    }
    
    let eventListHtml = '';

    if (isAllCategories) {
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
                        <details open>
                            <summary style="padding: 15px; background-color: #f7f7f7; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">
                               <h1 style="margin: 0; font-size: 18px; font-weight: bold; display: inline;">${category} (${sortedEvents.length})</h1>
                            </summary>
                            ${eventsHtml}
                        </details>
                    </div>
                `;
            })
            .join('');

    } else { // For specific category
        const sortedEvents = [...events].sort(sortLogic);
        eventListHtml = sortedEvents.map(event => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
                <p style="margin: 0; font-size: 16px;">
                    <strong>${event.title}</strong>
                    <span style="color: #718096; font-weight: bold; margin-left: 10px;">
                        ${event.time}
                    </span>
                </p>
            </div>
        `).join('');
    }

    const titleText = isAllCategories 
        ? "Aquí están los eventos de hoy:"
        : `Aquí están los eventos de hoy para ${categoryName}:`;

    return `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #333; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Deportes para Todos</h1>
            </div>
            <div style="padding: 20px;">
                <h2 style="color: #333;">${titleText}</h2>
                ${eventListHtml}
            </div>
            <div style="background-color: #f7f7f7; color: #777; padding: 15px; text-align: center; font-size: 12px;">
                <p>Para dejar de recibir estas notificaciones, puedes darte de baja directamente desde este correo o gestionar tus suscripciones en la aplicación.</p>
            </div>
        </div>
    `;
}

export async function GET() {
  if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX || !process.env.MAILCHIMP_AUDIENCE_ID) {
    console.error('Mailchimp API Key, Server Prefix or Audience ID are not configured.');
    return NextResponse.json({ error: 'Mailchimp configuration is incomplete.' }, { status: 500 });
  }

  try {
    console.log("CRON Job Started: Fetching subscribers...");
    
    const subscribersResponse = await mailchimp.lists.getListMembersInfo(process.env.MAILCHIMP_AUDIENCE_ID, {
        count: 1000, // Adjust as needed
        status: 'subscribed',
    });

    const subscribers = subscribersResponse.members;
    if (!subscribers || subscribers.length === 0) {
      console.log("No subscribers found. Cron job finished.");
      return NextResponse.json({ message: "No subscribers to email." });
    }

    console.log(`Found ${subscribers.length} subscribers. Grouping by tags...`);

    const subscribersByTag: Record<string, { email: string; id: string }[]> = {};
    subscribers.forEach(subscriber => {
        if (subscriber.tags.length > 0) {
            subscriber.tags.forEach(tag => {
                const tagName = tag.name;
                if (!subscribersByTag[tagName]) {
                    subscribersByTag[tagName] = [];
                }
                subscribersByTag[tagName].push({ email: subscriber.email_address, id: subscriber.id });
            });
        } else {
            // Default to 'all' if no tags are present, though the UI should enforce at least one.
            if (!subscribersByTag['all']) {
                subscribersByTag['all'] = [];
            }
            subscribersByTag['all'].push({ email: subscriber.email_address, id: subscriber.id });
        }
    });

    console.log(`Processing ${Object.keys(subscribersByTag).length} unique tag groups.`);
    const campaignResults = [];

    for (const [tag, groupSubscribers] of Object.entries(subscribersByTag)) {
        const isAllCategories = tag === 'all';
        const categoriesToFetch = isAllCategories ? ['all'] : [tag];
        
        console.log(`Fetching events for tag: [${tag}]...`);
        const events = await getEventsForNotification(categoriesToFetch);
        
        if (events.length === 0) {
            console.log(`No events for tag group [${tag}]. Skipping ${groupSubscribers.length} subscribers.`);
            campaignResults.push({ status: 'skipped', reason: 'No events', group: tag, count: groupSubscribers.length });
            continue;
        }

        const emailHtml = generateEmailHtml(events, isAllCategories, tag);
        const subject = `¡Hay ${events.length} eventos para ti hoy!`;

        try {
            console.log(`Creating campaign for tag [${tag}]...`);
            
            const segment = await mailchimp.lists.createSegment(process.env.MAILCHIMP_AUDIENCE_ID, {
                name: `Cron-Tag-${tag}-${Date.now()}`,
                options: {
                    match: 'all',
                    conditions: [{
                        condition_type: 'Tags',
                        field: 'tags',
                        op: 'contains',
                        value: [tag]
                    }]
                }
            });

            const campaign = await mailchimp.campaigns.create({
                type: 'regular',
                recipients: {
                    list_id: process.env.MAILCHIMP_AUDIENCE_ID,
                    segment_opts: {
                        saved_segment_id: segment.id,
                        match: 'any',
                        conditions: [], // Use the saved segment
                    },
                },
                settings: {
                    subject_line: subject,
                    preview_text: `Tus eventos para: ${isAllCategories ? 'Todas las categorías' : tag}`,
                    title: `Notificación Diaria - ${tag} - ${new Date().toISOString()}`,
                    from_name: 'Deportes Para Todos',
                    reply_to: 'deportesparatodos98@gmail.com',
                    from_email: 'deportesparatodos98@gmail.com',
                },
            });

            const campaignId = campaign.id;
            console.log(`Campaign created with ID: ${campaignId}. Setting content...`);
            
            await mailchimp.campaigns.setContent(campaignId, { html: emailHtml });
            console.log(`Content set. Sending campaign ${campaignId}...`);
            
            await mailchimp.campaigns.send(campaignId);
            console.log(`Campaign ${campaignId} sent successfully to group [${tag}].`);

            campaignResults.push({ status: 'success', group: tag, count: groupSubscribers.length });

        } catch (sendError: any) {
            const errorBody = sendError.response?.body;
            console.error(`Failed to create/send campaign for group [${tag}]:`, errorBody || sendError.message);
            campaignResults.push({ status: 'failed', group: tag, error: errorBody?.detail || 'Unknown send error' });
        }
    }

    return NextResponse.json({ 
        message: "Cron job executed.",
        results: campaignResults,
    });

  } catch (error: any) {
    const errorBody = error.response?.body;
    console.error('CRON Error:', errorBody || error.message);
    return NextResponse.json({ error: 'Internal Server Error during CRON execution', details: errorBody?.detail }, { status: 500 });
  }
}
