
import type { Event } from '@/components/event-list'; 
import { CategoryClientPage } from '@/components/category-client-page';

// Required for static export with dynamic routes
export async function generateStaticParams() {
  try {
    const response = await fetch('https://agenda-dpt.vercel.app/api/events');
    if (!response.ok) {
      // Return empty array on fetch error to avoid breaking the build
      return [];
    }
    const events: Event[] = await response.json();
    
    const categories = [...new Set(events.map((e) => e.category))];

    return categories.map((category) => ({
      slug: encodeURIComponent(category.toLowerCase().replace(/ /g, '-')),
    }));
  } catch (error) {
    console.error('Failed to fetch categories for generateStaticParams:', error);
    return [];
  }
}

async function getCategoryEvents(categoryName: string): Promise<Event[]> {
    try {
        const response = await fetch('https://agenda-dpt.vercel.app/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data: Omit<Event, 'status'> & { status: string }[] = await response.json();
        
        const processedEvents = data.map(e => ({
          ...e,
          status: e.status.charAt(0).toUpperCase() + e.status.slice(1) as Event['status'],
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


export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const categorySlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const categoryName = categorySlug ? decodeURIComponent(categorySlug).replace(/-/g, ' ') : 'Categoría';

  const initialEvents = await getCategoryEvents(categoryName);

  return <CategoryClientPage initialEvents={initialEvents} categoryName={categoryName} />;
}
