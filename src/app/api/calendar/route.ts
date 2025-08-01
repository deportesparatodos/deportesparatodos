
import { NextResponse, type NextRequest } from 'next/server';
import ical from 'ical-generator';
import { toZonedTime } from 'date-fns-tz';
import { addHours, isValid } from 'date-fns';

export const dynamic = 'force-dynamic';

interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number; // Timestamp
}

const normalizeCategory = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'football' || lowerCategory === 'fútbol' || lowerCategory === 'fútbol_cup') {
        return 'Fútbol';
    }
    const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
    return capitalized;
};

async function getAllEvents(filterCategory?: string | null) {
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

        let allEvents = combinedData.map((match: StreamedMatch) => {
            const zonedEventTime = toZonedTime(new Date(match.date), timeZone);
            return {
              title: match.title,
              category: normalizeCategory(categoryMap[match.category] || match.category),
              startTime: zonedEventTime,
            };
        });

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
                    end: addHours(event.startTime, 2), // Assume 2-hour duration
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
                'Content-Disposition': `inline; filename="${category || 'all'}-events.ics"`,
            },
        });
    } catch (error) {
        console.error("Error generating calendar:", error);
        return NextResponse.json({ error: 'Failed to generate calendar' }, { status: 500 });
    }
}
