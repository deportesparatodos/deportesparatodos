
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import type { Event } from '@/components/event-list'; 
import { Loader2, ArrowLeft, Tv } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const categorySlug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const categoryName = categorySlug ? decodeURIComponent(categorySlug).replace(/-/g, ' ') : 'Categoría';

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [categoryEvents, setCategoryEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [activeWindow, setActiveWindow] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
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

        setAllEvents(processedEvents);

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

        setCategoryEvents(filtered);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryName) {
      fetchEvents();
    }
     const storedSelectedEvents = localStorage.getItem('selectedEvents');
      if (storedSelectedEvents) {
        setSelectedEvents(JSON.parse(storedSelectedEvents));
      }
      const storedActiveWindow = localStorage.getItem('activeWindow');
      if (storedActiveWindow) {
        setActiveWindow(parseInt(storedActiveWindow, 10));
      }
  }, [categoryName]);

  useEffect(() => {
    localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
    localStorage.setItem('activeWindow', activeWindow.toString());
  }, [selectedEvents, activeWindow]);


  const handleEventSelect = (event: Event, optionUrl: string) => {
    const newSelectedEvents = [...selectedEvents];
    const eventWithSelection = { ...event, selectedOption: optionUrl };
    newSelectedEvents[activeWindow] = eventWithSelection;
    setSelectedEvents(newSelectedEvents);
    // Move to the next empty window or cycle back
    let nextWindow = (activeWindow + 1) % 9;
    for(let i=0; i<9; i++) {
        if (!newSelectedEvents[nextWindow]) {
            break;
        }
        nextWindow = (nextWindow + 1) % 9;
    }
    setActiveWindow(nextWindow);
  };
  
  const getEventSelection = (event: Event) => {
    const selection = selectedEvents.map((se, i) => se && se.title === event.title ? i : null).filter(i => i !== null);
    if (selection.length > 0) {
      return { isSelected: true, window: selection[0]! + 1 };
    }
    return { isSelected: false, window: null };
  };

  const handleStartView = () => {
    const urls = selectedEvents.map(e => e ? (e as any).selectedOption : '');
    localStorage.setItem('cameraUrls', JSON.stringify(urls));
    localStorage.setItem('numCameras', selectedEvents.filter(Boolean).length.toString());
    router.push('/view');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold capitalize">{categoryName}</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
                {selectedEvents.filter(Boolean).length > 0 && (
                    <div className="flex -space-x-4">
                        {selectedEvents.map((event, index) => event && (
                            <div key={index} className="relative h-12 w-12 rounded-full border-2 border-primary ring-2 ring-background">
                                <Image
                                    src={event.image || 'https://placehold.co/100x150.png'}
                                    alt={event.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-full"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Select onValueChange={(val) => setActiveWindow(parseInt(val))} value={activeWindow.toString()}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ventana de Destino" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 9 }).map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>Ventana {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
                onClick={handleStartView}
                disabled={selectedEvents.filter(Boolean).length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
            >
                <Tv className="mr-2 h-4 w-4" />
                Iniciar Vista ({selectedEvents.filter(Boolean).length})
            </Button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
          {categoryEvents.map((event, index) => (
            <EventCard
              key={`${event.title}-${index}`}
              event={event}
              onSelect={handleEventSelect}
              selection={getEventSelection(event)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

export default CategoryPage;
