
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Tv } from 'lucide-react';
import type { Event } from '@/components/event-carousel'; 
import { EventCarousel } from '@/components/event-carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { cn } from '@/lib/utils';
import { toZonedTime } from 'date-fns-tz';
import { isToday } from 'date-fns';
import { EventSelectionDialog } from '@/components/event-selection-dialog';

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [activeWindow, setActiveWindow] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
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

        setEvents(processedEvents);
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


  const todayEvents = useMemo(() => {
    const timeZone = 'America/New_York';
    return events.filter(e => {
        try {
            // The API date is a string like "2025-07-12"
            const eventDate = toZonedTime(e.date, timeZone);
            return isToday(eventDate);
        } catch (error) {
            console.error("Invalid date for event:", e.title, e.date);
            return false;
        }
    });
  }, [events]);

  const liveEvents = useMemo(() => todayEvents.filter((e) => e.status.toLowerCase() === 'en vivo').sort((a,b) => a.time.localeCompare(b.time)), [todayEvents]);
  const upcomingEvents = useMemo(() => todayEvents.filter((e) => e.status === 'Próximo').sort((a,b) => a.time.localeCompare(b.time)), [todayEvents]);
  const unknownEvents = useMemo(() => todayEvents.filter((e) => e.status === 'Desconocido').sort((a,b) => a.time.localeCompare(b.time)), [todayEvents]);
  const finishedEvents = useMemo(() => {
    // Filter all events from the original list, not just today's
    const allFinished = events.filter((e) => e.status === 'Finalizado').sort((a,b) => b.time.localeCompare(a.time));
    
    const timeZone = 'America/New_York';
    const todayFinished = allFinished.filter(e => {
        try {
            const eventDate = toZonedTime(e.date, timeZone);
            return isToday(eventDate);
        } catch (error) {
            return false;
        }
    });
    // Exclude today's finished events from the rest to avoid duplication
    const otherFinished = allFinished.filter(e => !todayFinished.includes(e));

    return [...todayFinished, ...otherFinished];
  }, [events]);


  const categories = useMemo(() => {
      const categorySet = new Set<string>();
      todayEvents.forEach((event) => {
        if (event.category) {
            categorySet.add(event.category);
        }
      });
      return Array.from(categorySet);
  }, [todayEvents]);

  const handleEventSelect = (event: Event, optionUrl: string) => {
    const newSelectedEvents = [...selectedEvents];
    const eventWithSelection = { ...event, selectedOption: optionUrl };

    const targetIndex = isModification ? modificationIndex! : activeWindow;
    newSelectedEvents[targetIndex] = eventWithSelection;
    setSelectedEvents(newSelectedEvents);

    if (!isModification) {
        let nextWindow = (activeWindow + 1) % 9;
        for(let i=0; i<9; i++) {
            if (!newSelectedEvents[nextWindow]) {
                break;
            }
            nextWindow = (nextWindow + 1) % 9;
        }
        setActiveWindow(nextWindow);
    }
    
    setDialogOpen(false);
    setIsModification(false);
    setModificationIndex(null);
  };

  const handleEventRemove = (windowIndex: number) => {
    const newSelectedEvents = [...selectedEvents];
    newSelectedEvents[windowIndex] = null;
    setSelectedEvents(newSelectedEvents);
    setActiveWindow(windowIndex);
    setDialogOpen(false);
    setIsModification(false);
    setModificationIndex(null);
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
  
  const openDialogForEvent = (event: Event) => {
    setDialogEvent(event);
    const selection = getEventSelection(event);
    if(selection.isSelected) {
      setIsModification(true);
      setModificationIndex(selection.window! - 1);
    } else {
      setIsModification(false);
      setModificationIndex(null);
    }
    setDialogOpen(true);
  };
  
  const openDialogForModification = (event: Event, index: number) => {
    setDialogEvent(event);
    setIsModification(true);
    setModificationIndex(index);
    setDialogOpen(true);
  }

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
                        <h3 className="text-sm font-semibold text-muted-foreground">Seleccionados:</h3>
                        <div className="flex flex-wrap gap-2">
                            {[...Array(9)].map((_, i) => {
                                const event = selectedEvents[i];
                                if (event) {
                                    return (
                                        <Button
                                            key={i}
                                            onClick={() => openDialogForModification(event, i)}
                                            variant="outline"
                                            className="w-10 h-10 p-0"
                                        >
                                            {i + 1}
                                        </Button>
                                    );
                                }
                                return (
                                     <Button
                                        key={i}
                                        onClick={() => setActiveWindow(i)}
                                        variant={activeWindow === i ? 'default' : 'outline'}
                                        className="w-10 h-10"
                                    >
                                        {i + 1}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-4">
                 {selectedEvents.filter(Boolean).length === 0 && (
                     <div className="hidden md:flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-muted-foreground">Ventana Activa:</h3>
                        <div className="flex flex-wrap gap-2">
                            {[...Array(9)].map((_, i) => (
                                <Button
                                    key={i}
                                    onClick={() => setActiveWindow(i)}
                                    variant={activeWindow === i ? 'default' : 'outline'}
                                    className="w-10 h-10"
                                >
                                    {i + 1}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
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
                {categories.length > 0 && (
                    <div className="w-full space-y-4">
                        <h2 className="text-2xl font-bold">Categorías</h2>
                        <Carousel
                            opts={{
                            align: "start",
                            dragFree: true,
                            }}
                            className="w-full relative px-12"
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
                            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
                        </Carousel>
                    </div>
                )}
                
                <EventCarousel title="En Vivo" events={liveEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                <EventCarousel title="Próximos" events={upcomingEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                <EventCarousel title="Estado Desconocido" events={unknownEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                <EventCarousel title="Finalizados" events={finishedEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
            </div>
        </main>
        
        {dialogEvent && (
            <EventSelectionDialog
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                event={dialogEvent}
                onSelect={handleEventSelect}
                isModification={isModification}
                onRemove={() => handleEventRemove(modificationIndex!)}
                windowNumber={isModification ? modificationIndex! + 1 : activeWindow + 1}
            />
        )}
    </div>
  );
}
