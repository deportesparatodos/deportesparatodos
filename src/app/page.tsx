
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Tv } from 'lucide-react';
import { toZonedTime, isAfter, parseISO, isValid, format } from 'date-fns';
import { addHours } from 'date-fns';
import type { Event } from '@/components/event-list'; 
import { EventCarousel } from '@/components/event-carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';


export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [activeWindow, setActiveWindow] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('https://deportes-para-todos-api.vercel.app/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data: Event[] = await response.json();
        
        const timeZone = 'America/Argentina/Buenos_Aires';
        const now = toZonedTime(new Date(), timeZone);
        
        const eventsWithStatus = data.map(e => {
            if (e.options.some(opt => opt.includes('embedrun.store') || opt.includes('embedstreams.top'))) {
                return { ...e, status: 'En Vivo' as const };
            }
            if (e.title.includes('24/7')) {
              return { ...e, status: 'En Vivo' as const };
            }
            let eventStartStr = `${e.date}T${e.time}:00`;
            if (e.time.match(/^\d{10}$/)) {
                 eventStartStr = new Date(parseInt(e.time, 10) * 1000).toISOString();
            }
            const eventStart = toZonedTime(parseISO(eventStartStr), timeZone);
            if (!isValid(eventStart)) {
              return { ...e, status: 'Finalizado' as const };
            }
            let durationInHours = 3;
            const durationMatch = e.title.match(/(\d+)\s*(?:hs|horas)/i);
            if (durationMatch && durationMatch[1]) {
                durationInHours = parseInt(durationMatch[1], 10) + 1;
            }
            const eventEnd = addHours(eventStart, durationInHours);
            if (isAfter(now, eventEnd)) return { ...e, status: 'Finalizado' as const };
            if (isAfter(now, eventStart)) return { ...e, status: 'En Vivo' as const };

            const currentHour = now.getHours();
            if (currentHour >= 21 || currentHour < 6) return { ...e, status: 'Desconocido' as const };

            return { ...e, status: 'Próximo' as const };
        });

        setEvents(eventsWithStatus);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();

      const storedSelectedEvents = localStorage.getItem('selectedEvents');
      if (storedSelectedEvents) {
        setSelectedEvents(JSON.parse(storedSelectedEvents));
      }
      const storedActiveWindow = localStorage.getItem('activeWindow');
      if (storedActiveWindow) {
        setActiveWindow(parseInt(storedActiveWindow, 10));
      }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
    localStorage.setItem('activeWindow', activeWindow.toString());
  }, [selectedEvents, activeWindow]);


  const liveEvents = useMemo(() => events.filter((e) => e.status === 'En Vivo').sort((a,b) => a.time.localeCompare(b.time)), [events]);
  const upcomingEvents = useMemo(() => events.filter((e) => e.status === 'Próximo').sort((a,b) => a.time.localeCompare(b.time)), [events]);
  const unknownEvents = useMemo(() => events.filter((e) => e.status === 'Desconocido').sort((a,b) => a.time.localeCompare(b.time)), [events]);
  const finishedEvents = useMemo(() => events.filter((e) => e.status === 'Finalizado').sort((a,b) => b.time.localeCompare(a.time)), [events]);
  const categories = useMemo(() => {
    const allCategories = events.map((e) => e.category);
    return [...new Set(allCategories)];
  }, [events]);

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
            <div className="flex items-center gap-6">
                <Link href="/" className="shrink-0">
                    <Image
                        src="https://i.ibb.co/BVLhxp2k/deportes-para-todos.png"
                        alt="Deportes Para Todos Logo"
                        width={150}
                        height={37.5}
                        priority
                        data-ai-hint="logo"
                    />
                </Link>
                {selectedEvents.filter(Boolean).length > 0 && (
                    <div className="hidden md:flex items-center gap-2">
                         <div className="flex items-center gap-2">
                             <h3 className="text-sm font-semibold text-muted-foreground">Seleccionados:</h3>
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
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
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

        <main className="flex-grow overflow-y-auto">
            <div className="space-y-12 p-4 md:p-8">
                {/* Categories Carousel */}
                <div className="w-full space-y-4">
                    <h2 className="text-2xl font-bold">Categorías</h2>
                    <Carousel
                        opts={{
                        align: "start",
                        dragFree: true,
                        }}
                        className="w-full"
                    >
                        <CarouselContent className="-ml-4">
                        {categories.map((category) => (
                            <CarouselItem key={category} className="basis-auto pl-4">
                                <Link href={`/category/${encodeURIComponent(category.toLowerCase().replace(/ /g, '-'))}`}>
                                    <Button variant="secondary" className="h-12 px-6 text-lg">
                                        {category}
                                    </Button>
                                </Link>
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                        <CarouselPrevious className="ml-14" />
                        <CarouselNext className="mr-14" />
                    </Carousel>
                </div>
                
                <EventCarousel title="En Vivo" events={liveEvents} onSelect={handleEventSelect} getEventSelection={getEventSelection}/>
                <EventCarousel title="Próximos" events={upcomingEvents} onSelect={handleEventSelect} getEventSelection={getEventSelection}/>
                <EventCarousel title="Estado Desconocido" events={unknownEvents} onSelect={handleEventSelect} getEventSelection={getEventSelection}/>
                <EventCarousel title="Finalizados" events={finishedEvents} onSelect={handleEventSelect} getEventSelection={getEventSelection}/>
            </div>
        </main>
    </div>
  );
}

    