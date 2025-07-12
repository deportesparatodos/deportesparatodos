
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Tv, X, Menu, Search, RotateCw } from 'lucide-react';
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
import type { Channel } from '@/components/channel-list';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/event-card';


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
  const [searchTerm, setSearchTerm] = useState('');

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://agenda-dpt.vercel.app/api/events', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data: Event[] = await response.json();
      
      const processedEvents = data.map(e => ({
        ...e,
        category: e.category.toLowerCase() === 'other' ? 'Otros' : e.category,
        status: e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1)) as Event['status'] : 'Desconocido',
      }));

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

      const storedSelectedEvents = localStorage.getItem('selectedEvents');
      if (storedSelectedEvents) {
        setSelectedEvents(JSON.parse(storedSelectedEvents));
      }
  }, [fetchEvents]);

  useEffect(() => {
    localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
  }, [selectedEvents]);

  const { liveEvents, upcomingEvents, unknownEvents, finishedEvents, filteredChannels, searchResults } = useMemo(() => {
    const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2, 'Desconocido': 3, 'Finalizado': 4 };

    const live = events.filter((e) => e.status.toLowerCase() === 'en vivo');
    live.sort((a,b) => {
        const aIsEmbedStream = a.options.some(opt => opt.startsWith('https://embedstreams.top'));
        const bIsEmbedStream = b.options.some(opt => opt.startsWith('https://embedstreams.top'));
        if (aIsEmbedStream && !bIsEmbedStream) return 1;
        if (!aIsEmbedStream && bIsEmbedStream) return -1;
        return a.time.localeCompare(b.time);
    });

    const upcoming = events.filter((e) => e.status.toLowerCase() === 'próximo').sort((a,b) => a.time.localeCompare(b.time));
    const unknown = events.filter((e) => e.status.toLowerCase() === 'desconocido').sort((a,b) => a.time.localeCompare(b.time));
    const finished = events.filter((e) => e.status.toLowerCase() === 'finalizado').sort((a,b) => b.time.localeCompare(a.time));

    let searchResults: (Event | Channel)[] = [];
    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const filteredEvents = events.filter(e => e.title.toLowerCase().includes(lowercasedFilter));
        const sChannels = channels.filter(c => c.name.toLowerCase().includes(lowercasedFilter));

        filteredEvents.sort((a, b) => {
            return (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5);
        });

        searchResults = [...filteredEvents, ...sChannels];
    }

    return { 
        liveEvents: live, 
        upcomingEvents: upcoming, 
        unknownEvents: unknown, 
        finishedEvents: finished, 
        filteredChannels: channels,
        searchResults
    };
  }, [events, searchTerm]);


  const categories = useMemo(() => {
      const categorySet = new Set<string>();
      events.forEach((event) => {
        if (event.category) {
            const category = event.category.toLowerCase() === 'other' ? 'Otros' : event.category;
            categorySet.add(category);
        }
      });
      const filteredCategories = Array.from(categorySet).filter(category => 
        events.some(event => (event.category.toLowerCase() === 'other' ? 'Otros' : event.category) === category)
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
      setModificationIndex(selectedEvents.findIndex(e => e === null)); // Target first empty slot
    }
    setDialogOpen(true);
  };

   const handleChannelClick = (channel: Channel) => {
    const channelAsEvent: Event = {
      title: channel.name,
      options: [channel.url],
      buttons: ['Ver canal'],
      time: '',
      category: 'Canal',
      language: '',
      date: '',
      source: '',
      status: 'En Vivo',
      image: channel.logo,
    };
    openDialogForEvent(channelAsEvent);
  };
  
  const openDialogForModification = (event: Event, index: number) => {
    setSheetOpen(false); // Close sheet before opening dialog
    setDialogEvent(event);
    setIsModification(true);
    setModificationIndex(index);
    setDialogOpen(true);
  }

  if (isLoading && events.length === 0) {
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
                        src="https://i.ibb.co/gZKpR4fc/deportes-para-todos.png"
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

        <main className="flex-grow overflow-y-auto p-4 md:p-8">
            <div className="space-y-4">
                <div className="w-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            type="text"
                            placeholder="Buscar evento o canal..."
                            className="w-full pl-10 pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={fetchEvents}>
                             <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {searchTerm ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
                        {searchResults.map((item, index) => {
                            if ('url' in item) { // It's a Channel
                                return (
                                    <Card 
                                        key={`search-channel-${index}`}
                                        className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border"
                                        onClick={() => handleChannelClick(item)}
                                    >
                                        <div className="relative w-full aspect-video flex items-center justify-center p-4 bg-white/10 h-[100px]">
                                            <Image
                                                src={item.logo}
                                                alt={`${item.name} logo`}
                                                width={120}
                                                height={67.5}
                                                className="object-contain max-h-full max-w-full"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null; 
                                                    target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                                                }}
                                            />
                                        </div>
                                        <div className="p-3 bg-card">
                                            <h3 className="font-bold truncate text-sm text-center">{item.name}</h3>
                                        </div>
                                    </Card>
                                );
                            } else { // It's an Event
                                return (
                                    <EventCard
                                      key={`search-event-${index}`}
                                      event={item}
                                      selection={getEventSelection(item)}
                                      onClick={() => openDialogForEvent(item)}
                                    />
                                );
                            }
                        })}
                    </div>
                ) : (
                    <>
                        <div className="w-full mt-2">
                             <Carousel
                                opts={{
                                align: "start",
                                dragFree: true,
                                }}
                                className="w-full relative px-12"
                            >
                                <CarouselContent className="-ml-4">
                                    <CarouselItem className="basis-auto pl-4">
                                        <Link href={`/events/live`}>
                                            <Button variant="secondary" className="h-12 px-6 text-lg">
                                                En Vivo
                                            </Button>
                                        </Link>
                                    </CarouselItem>
                                     <CarouselItem className="basis-auto pl-4">
                                        <Link href={`/events/channels`}>
                                            <Button variant="secondary" className="h-12 px-6 text-lg">
                                                Canales
                                            </Button>
                                        </Link>
                                    </CarouselItem>
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
                        
                        <EventCarousel title="En Vivo" events={liveEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />

                        <EventCarousel title="Canales" channels={filteredChannels} onChannelClick={handleChannelClick} />

                        <EventCarousel title="Próximos" events={upcomingEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                        <EventCarousel title="Estado Desconocido" events={unknownEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                        <EventCarousel title="Finalizados" events={finishedEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                    </>
                )}
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
                windowNumber={(modificationIndex ?? selectedEvents.findIndex(e => e === null))! + 1}
            />
        )}
    </div>
  );
}

    