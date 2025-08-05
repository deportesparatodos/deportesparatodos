
import { NextResponse, type NextRequest } from 'next/server';
import ical from 'ical-generator';
import { toZonedTime, toDate } from 'date-fns-tz';
import { addHours, isValid } from 'date-fns';

export const dynamic = 'force-dynamic';

interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number; // Timestamp
}

interface TCChaserEvent {
  event_time_and_day: string; // "2025-08-09T10:00:00.000Z"
  event_title: string;
  end_date: string;
  cover_image: string;
}

const normalizeCategory = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'football' || lowerCategory === 'fútbol' || lowerCategory === 'fútbol_cup') {
        return 'Fútbol';
    }
    if (lowerCategory === 'motor sports' || lowerCategory === 'motorsports') {
        return 'Motor Sports';
    }
    const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
    return capitalized;
};

async function getAllEvents(filterCategory?: string | null) {
    const timeZone = 'America/Argentina/Buenos_Aires';

    try {
        const [liveResponse, todayResponse, sportsResponse, tcChaserResponse] = await Promise.all([
            fetch('https://streamed.pk/api/matches/live').then(res => res.ok ? res.json() : []).catch(() => []),
            fetch('https://streamed.pk/api/matches/all-today').then(res => res.ok ? res.json() : []).catch(() => []),
            fetch('https://streamed.pk/api/sports').then(res => res.ok ? res.json() : []).catch(() => []),
            fetch('https://tc-chaser.vercel.app/api/events').then(res => res.ok ? res.json() : []).catch(() => []),
        ]);

        const liveData: StreamedMatch[] = Array.isArray(liveResponse) ? liveResponse : [];
        const todayData: StreamedMatch[] = Array.isArray(todayResponse) ? todayResponse : [];
        const sportsData: {id: string; name: string}[] = Array.isArray(sportsResponse) ? sportsResponse : [];
        const tcChaserData: TCChaserEvent[] = Array.isArray(tcChaserResponse) ? tcChaserResponse : [];

        const categoryMap = sportsData.reduce<Record<string, string>>((acc, sport) => {
            acc[sport.id] = sport.name;
            return acc;
        }, {});
        
        const allMatchesMap = new Map<string, StreamedMatch>();
        todayData.forEach(match => allMatchesMap.set(match.id, match));
        liveData.forEach(match => allMatchesMap.set(match.id, match));
        
        const combinedData = Array.from(allMatchesMap.values());
        
        let allEvents = combinedData.map((match: StreamedMatch) => {
            const zonedEventTime = toZonedTime(new Date(match.date), timeZone);
            return {
              title: match.title,
              category: normalizeCategory(categoryMap[match.category] || match.category),
              startTime: zonedEventTime,
              endTime: addHours(zonedEventTime, 2),
            };
        });

        const tcChaserEvents = tcChaserData.map(event => {
            const startTime = toDate(event.event_time_and_day, { timeZone });
            const endTime = toDate(event.end_date, { timeZone });
            return {
                title: event.event_title,
                category: 'Motor Sports',
                startTime: startTime,
                endTime: endTime
            };
        });

        allEvents.push(...tcChaserEvents);

        if (filterCategory) {
            const normalizedFilter = normalizeCategory(filterCategory);
            allEvents = allEvents.filter(event => normalizeCategory(event.category) === normalizedFilter);
        }
        
        return allEvents;

    } catch (error) {
        console.error("Error fetching events for calendar:", error);
        return [];
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    try {
        const events = await getAllEvents(category);
        const calendarName = category ? `Deportes Para Todos - ${normalizeCategory(category)}` : 'Deportes Para Todos - Eventos';
        const calendar = ical({ name: calendarName });
        
        const timeZone = 'America/Argentina/Buenos_Aires';
        calendar.timezone(timeZone);

        events.forEach(event => {
            if (isValid(event.startTime)) {
                calendar.createEvent({
                    start: event.startTime,
                    end: event.endTime,
                    summary: event.title,
                    description: `Categoría: ${event.category}`,
                    location: 'Online',
                });
            }
        });

        return new Response(calendar.toString(), {
            status: 200,
            headers: {
                'Content-Type': 'text/calendar; charset=utf-8',
            },
        });
    } catch (error) {
        console.error("Error generating calendar:", error);
        return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
    }
}
