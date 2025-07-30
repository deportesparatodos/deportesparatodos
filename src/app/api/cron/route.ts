
import { NextResponse, type NextRequest } from 'next/server';
import { kv } from '@vercel/kv';
import { Resend } from 'resend';
import { parse, isBefore, differenceInMinutes, addMinutes, format, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const resend = new Resend(process.env.RESEND_API_KEY);

const EVENTS_CACHE_KEY = 'dpt_daily_events_cache';
const SUBSCRIPTIONS_KEY = 'dpt_all_subscriptions';
const NOTIFIED_EVENTS_KEY_PREFIX = 'dpt_notified_';

interface Event {
  title: string;
  time: string;
  date: string;
  category: string;
}
interface Subscription {
  id: string;
  type: 'event' | 'category';
  title: string;
  notifyAt: number;
}
interface SubscriptionData {
  pushoverEmail: string;
  subscriptions: Subscription[];
}

// Fetch all events from multiple sources and cache them
async function fetchAndCacheEvents() {
    console.log("CRON: Starting to fetch and cache events...");
    try {
        const [liveResponse, todayResponse, streamTpResponse, agendaResponse] = await Promise.all([
            fetch('https://streamed.su/api/matches/live').then(res => res.json()).catch(() => []),
            fetch('https://streamed.su/api/matches/all-today').then(res => res.json()).catch(() => []),
            fetch('https://streamtpglobal.com/eventos.json').then(res => res.json()).catch(() => []),
            fetch('https://agenda-dpt.vercel.app/api/events').then(res => res.json()).catch(() => []),
        ]);

        const timeZone = 'America/Argentina/Buenos_Aires';
        const todayStr = format(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd');

        const allMatchesMap = new Map();
        if (Array.isArray(todayResponse)) todayResponse.forEach(match => allMatchesMap.set(match.id, match));
        if (Array.isArray(liveResponse)) liveResponse.forEach(match => allMatchesMap.set(match.id, match));

        const initialEvents = Array.from(allMatchesMap.values()).map(match => ({
            title: match.title,
            time: format(toZonedTime(new Date(match.date), timeZone), 'HH:mm'),
            date: format(toZonedTime(new Date(match.date), timeZone), 'yyyy-MM-dd'),
            category: match.category,
        }));

        const streamTpEvents = Array.isArray(streamTpResponse) ? streamTpResponse.map((event: any) => ({
            title: event.title,
            time: event.time,
            date: todayStr,
            category: event.category,
        })) : [];

        const agendaEvents = Array.isArray(agendaResponse) ? agendaResponse.map((event: any) => ({
            title: event.title,
            time: event.time,
            date: event.date,
            category: event.category,
        })) : [];
        
        const allEvents = [...initialEvents, ...streamTpEvents, ...agendaEvents].filter(e => e.date === todayStr && /^\d{2}:\d{2}$/.test(e.time));
        
        await kv.set(EVENTS_CACHE_KEY, JSON.stringify(allEvents), { ex: 86400 }); // Cache for 24 hours
        console.log(`CRON: Successfully fetched and cached ${allEvents.length} events.`);
        return allEvents;
    } catch (error) {
        console.error('CRON: Error fetching or caching events:', error);
        return [];
    }
}


// Process notifications based on cached events and subscriptions
async function processNotifications() {
    console.log("CRON: Starting notification processing...");
    const cachedEventsStr = await kv.get<string>(EVENTS_CACHE_KEY);
    if (!cachedEventsStr) {
        console.log("CRON: No cached events found. Triggering a new fetch.");
        await fetchAndCacheEvents();
        return;
    }
    const events: Event[] = JSON.parse(cachedEventsStr);

    const allSubsData: Record<string, SubscriptionData> | null = await kv.get(SUBSCRIPTIONS_KEY);
    if (!allSubsData) {
        console.log("CRON: No subscriptions found to process.");
        return;
    }
    
    const timeZone = 'America/Argentina/Buenos_Aires';
    const now = toZonedTime(new Date(), timeZone);

    for (const userData of Object.values(allSubsData)) {
        const { pushoverEmail, subscriptions } = userData;
        if (!pushoverEmail || subscriptions.length === 0) continue;
        
        for (const sub of subscriptions) {
            const eventsToNotify = events.filter(event => 
                (sub.type === 'event' && `event-${event.title}-${event.date}-${event.time}`.replace(/\s+/g, '-') === sub.id) ||
                (sub.type === 'category' && event.category === sub.title)
            );
            
            for (const event of eventsToNotify) {
                 try {
                    const eventDateTime = parse(`${event.date} ${event.time}`, 'yyyy-MM-dd HH:mm', new Date());
                    if (!isValid(eventDateTime)) continue;

                    const notifyDateTime = addMinutes(eventDateTime, -sub.notifyAt);
                    const minutesUntilNotify = differenceInMinutes(notifyDateTime, now);

                    if (minutesUntilNotify >= 0 && minutesUntilNotify < 15) {
                        const notificationId = `notified-${sub.id}-${event.title}-${event.date}-${event.time}`;
                        const hasBeenNotified = await kv.get(notificationId);
                        
                        if (!hasBeenNotified) {
                            console.log(`CRON: Sending notification for "${event.title}" to ${pushoverEmail}`);
                            await resend.emails.send({
                                from: 'onboarding@resend.dev',
                                to: pushoverEmail,
                                subject: `Recordatorio: ${event.title} a las ${event.time}`,
                                html: `<p>¡Hola! Te recordamos que el evento <strong>${event.title}</strong> (${event.category}) comenzará pronto, a las ${event.time}.</p><p>¡No te lo pierdas!</p>`,
                            });
                            await kv.set(notificationId, 'true', { ex: 86400 }); // Mark as notified for 24h
                        }
                    }
                } catch(e) {
                    console.error(`CRON: Error processing event ${event.title}`, e);
                }
            }
        }
    }
     console.log("CRON: Notification processing finished.");
}


export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const processParam = searchParams.get('process');

  if (processParam) {
    // This is the frequent cron job to process notifications
    await processNotifications();
    return NextResponse.json({ status: 'ok', task: 'processing' });
  } else {
    // This is the daily cron job to fetch and cache events
    await fetchAndCacheEvents();
    return NextResponse.json({ status: 'ok', task: 'caching' });
  }
}
