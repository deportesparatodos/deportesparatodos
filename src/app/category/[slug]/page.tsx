
import { CategoryClientPage } from '@/components/category-client-page';
import type { Event } from '@/components/event-carousel';
import { toZonedTime } from 'date-fns-tz';
import { isToday } from 'date-fns';

// This function runs at build time to fetch all possible categories
export async function generateStaticParams() {
  try {
    const response = await fetch('https://agenda-dpt.vercel.app/api/events');
    if (!response.ok) {
        console.error('Failed to fetch events for static params');
        return [];
    }
    const events: Event[] = await response.json();
    const categories = [...new Set(events.map((e) => e.category))];
    
    return categories.map((category) => ({
      slug: category.toLowerCase().replace(/ /g, '-'),
    }));
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
    return [];
  }
}

// This function runs on the server for each category page
async function getCategoryEvents(categoryName: string): Promise<Event[]> {
    try {
        const response = await fetch('https://agenda-dpt.vercel.app/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data: Event[] = await response.json();
        
        const processedEvents = data.map(e => ({
          ...e,
          status: e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1)) as Event['status'] : 'Desconocido',
        }));

        const filtered = processedEvents.filter(
          (event) => event.category.toLowerCase() === categoryName.toLowerCase()
        );

        const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2, 'Desconocido': 3, 'Finalizado': 4 };
        filtered.sort((a, b) => {
            if (a.status !== b.status) {
                return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
            }
            return a.time.localeCompare(b.time);
        });
        return filtered;
    } catch (error) {
        console.error('Error fetching events:', error);
        return [];
    }
}

// The main page component (Server Component)
export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const categoryName = categorySlug ? decodeURIComponent(categorySlug).replace(/-/g, ' ') : 'Categoría';

  const initialEvents = await getCategoryEvents(categoryName);

  return <CategoryClientPage initialEvents={initialEvents} categoryName={categoryName} />;
}
