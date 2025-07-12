
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Tv, X, Menu } from 'lucide-react';
import type { Event } from '@/components/event-carousel'; 
import { EventCarousel } from '@/components/event-carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { EventSelectionDialog } from '@/components/event-selection-dialog';
import { channels } from '@/components/channel-list';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
  }, [selectedEvents]);


  const liveEvents = useMemo(() => events.filter((e) => e.status.toLowerCase() === 'en vivo').sort((a,b) => a.time.localeCompare(b.time)), [events]);
  const upcomingEvents = useMemo(() => events.filter((e) => e.status.toLowerCase() === 'próximo').sort((a,b) => a.time.localeCompare(b.time)), [events]);
  const unknownEvents = useMemo(() => events.filter((e) => e.status.toLowerCase() === 'desconocido').sort((a,b) => a.time.localeCompare(b.time)), [events]);
  const finishedEvents = useMemo(() => events.filter((e) => e.status.toLowerCase() === 'finalizado').sort((a,b) => b.time.localeCompare(a.time)), [events]);


  const categories = useMemo(() => {
      const categorySet = new Set<string>();
      events.forEach((event) => {
        if (event.category) {
            categorySet.add(event.category);
        }
      });
      const filteredCategories = Array.from(categorySet).filter(category => 
        events.some(event => event.category === category)
      );
      return filteredCategories;
  }, [events]);

  const handleEventSelect = (event: Event, optionUrl: string) => {
    const newSelectedEvents = [...selectedEvents];
    const eventWithSelection = { ...event, selectedOption: optionUrl };
    
    let targetIndex = -1;
    if (isModification && modificationIndex !== null) {
        targetIndex = modificationIndex;
    } else {
        targetIndex = newSelectedEvents.findIndex(e => e === null);
    }
    
    if (targetIndex !== -1) {
        newSelectedEvents[targetIndex] = eventWithSelection;
        setSelectedEvents(newSelectedEvents);
    } else {
        // Handle case where all 9 slots are full, maybe show a toast
        console.log("All selection slots are full.");
    }
    
    setDialogOpen(false);
    setIsModification(false);
    setModificationIndex(null);
  };
  
  const handleEventRemove = (windowIndex: number) => {
    const newSelectedEvents = [...selectedEvents];
    newSelectedEvents[windowIndex] = null;
    setSelectedEvents(newSelectedEvents);
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
    setSheetOpen(false); // Close sheet before opening dialog
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
            </div>

            <div className="flex items-center gap-2">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                         <Button
                            variant="outline"
                            disabled={selectedEvents.filter(Boolean).length === 0}
                        >
                            <Menu className="mr-2 h-4 w-4" />
                            Eventos Seleccionados
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Tus Eventos Seleccionados</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100%-4rem)] mt-4">
                            <div className="space-y-4 pr-4">
                                {selectedEvents.map((event, index) => event && (
                                     <div key={index} className="flex items-center gap-4 cursor-pointer" onClick={() => openDialogForModification(event, index)}>
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="relative w-28 h-auto aspect-video rounded-md overflow-hidden">
                                             <Image
                                                src={event.image || 'https://i.ibb.co/dHPWxr8/depete.jpg'}
                                                alt={event.title}
                                                width={160}
                                                height={90}
                                                className="object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.onerror = null; 
                                                  target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                                                }}
                                            />
                                        </div>
                                        <p className="text-sm font-semibold flex-grow truncate">{event.title}</p>
                                    </div>
                                ))}
                                {selectedEvents.filter(Boolean).length === 0 && (
                                    <p className="text-muted-foreground text-center pt-8">No has seleccionado ningún evento.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
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

                 <div className="w-full space-y-4">
                    <h2 className="text-2xl font-bold">Canales</h2>
                    <Carousel
                        opts={{
                            align: "start",
                            dragFree: true,
                            slidesToScroll: 'auto',
                        }}
                        className="w-full relative px-12"
                    >
                        <CarouselContent className="-ml-4 py-4">
                        {channels.map((channel, index) => (
                            <CarouselItem key={index} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7 pl-4">
                                <Card className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border">
                                    <div className="relative w-full aspect-video flex items-center justify-center p-4">
                                        <Image
                                            src={channel.logo}
                                            alt={`${channel.name} logo`}
                                            width={120}
                                            height={67.5}
                                            objectFit="contain"
                                        />
                                    </div>
                                    <div className="p-3 bg-card">
                                        <h3 className="font-bold truncate text-sm text-center">{channel.name}</h3>
                                    </div>
                                </Card>
                            </CarouselItem>
                        ))}
                        </CarouselContent>
                        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
                    </Carousel>
                </div>
                
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
                windowNumber={(isModification ? modificationIndex : selectedEvents.findIndex(e => e === null))! + 1}
            />
        )}
    </div>
  );
}
