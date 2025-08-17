
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X, Maximize, Minimize, RotateCw } from 'lucide-react';
import { EventCard } from './event-card';
import type { Event, StreamOption } from './event-carousel';
import { Card } from './ui/card';
import Image from 'next/image';
import type { Channel } from './channel-list';
import { EventCarousel } from './event-carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { parse, isValid, isBefore } from 'date-fns';

interface AddEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSelect: (event: Event) => void;
  onChannelClick: (channel: Channel) => void;
  getEventSelection: (event: Event) => { isSelected: boolean; selectedOption: string | null };
  events: Event[];
  channels: Channel[];
  liveEvents: Event[];
  upcomingEvents: Event[];
  unknownEvents: Event[];
  finishedEvents: Event[];
  channels247Events: Event[];
}

export function AddEventsDialog({ 
    open, 
    onOpenChange,
    onEventSelect,
    onChannelClick,
    getEventSelection,
    events,
    channels,
    liveEvents,
    upcomingEvents,
    unknownEvents,
    finishedEvents,
    channels247Events
}: AddEventsDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setIsFullScreen(false);
        }
    }, [open]);

    const handleChannelClick = (channel: Channel) => {
        onChannelClick(channel);
        onOpenChange(false);
    }
    
    const handleEventClick = (event: Event) => {
        onEventSelect(event);
        onOpenChange(false);
    }
    
    const searchResults = useMemo(() => {
        if (!searchTerm) return [];
        const lowercasedFilter = searchTerm.toLowerCase();

        const filteredEvents = events.filter(event =>
            event.title.toLowerCase().includes(lowercasedFilter)
        );
        const filteredChannels = channels.filter(channel =>
            channel.name.toLowerCase().includes(lowercasedFilter)
        );
        return [...filteredEvents, ...filteredChannels];
    }, [searchTerm, events, channels]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                hideClose={true}
                className={cn(
                    "flex flex-col p-4 transition-all duration-300",
                    isFullScreen 
                        ? "w-screen h-screen max-w-none rounded-none inset-0 translate-x-0 translate-y-0"
                        : "h-[90vh] sm:max-w-4xl"
                )}
            >
                <DialogHeader className='flex-row items-center justify-between pb-0'>
                    <DialogTitle>Añadir Evento/Canal</DialogTitle>
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)}>
                           {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { onOpenChange(false); }}>
                           <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>
                 
                <div className="relative flex-grow flex flex-col mt-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Buscar evento o canal..."
                            className="w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="flex-grow h-0 mt-4">
                        {searchTerm ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {searchResults.map((item, index) => {
                                    if ('urls' in item) { // It's a Channel
                                        const channelAsEvent: Event = { id: `${item.name}-channel-static`, title: item.name, options: [], sources: [], buttons: [], time: 'AHORA', category: 'Canal', language: '', date: '', source: '', status: 'En Vivo', image: item.logo };
                                        const selection = getEventSelection(channelAsEvent);
                                        return (
                                            <Card key={`search-channel-${index}`} onClick={() => handleChannelClick(item)} className="cursor-pointer">
                                                <div className="relative w-full aspect-video bg-white p-2">
                                                     <Image src={item.logo} alt={item.name} fill className="object-contain" />
                                                      {selection.isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                            <Check className="h-10 w-10 text-green-500" />
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-sm p-2 text-center">{item.name}</h3>
                                            </Card>
                                        )
                                    } else { // It's an Event
                                        return (
                                            <EventCard key={`search-event-${index}`} event={item} selection={getEventSelection(item)} onClick={() => handleEventClick(item)} />
                                        )
                                    }
                                })}
                            </div>
                        ) : (
                             <Tabs defaultValue="live" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="live">En Vivo</TabsTrigger>
                                    <TabsTrigger value="upcoming">Próximos</TabsTrigger>
                                    <TabsTrigger value="channels">Canales</TabsTrigger>
                                </TabsList>
                                <TabsContent value="live" className="mt-4">
                                    <EventCarousel title="En Vivo" events={liveEvents} onCardClick={handleEventClick} getEventSelection={getEventSelection} />
                                    <EventCarousel title="24/7" events={channels247Events} onCardClick={handleEventClick} getEventSelection={getEventSelection} />
                                </TabsContent>
                                <TabsContent value="upcoming" className="mt-4">
                                     <EventCarousel title="Próximos" events={upcomingEvents} onCardClick={handleEventClick} getEventSelection={getEventSelection} />
                                     <EventCarousel title="Estado Desconocido" events={unknownEvents} onCardClick={handleEventClick} getEventSelection={getEventSelection} />
                                     <EventCarousel title="Finalizados" events={finishedEvents} onCardClick={handleEventClick} getEventSelection={getEventSelection} />
                                </TabsContent>
                                <TabsContent value="channels" className="mt-4">
                                     <EventCarousel title="Canales" channels={channels} onChannelClick={handleChannelClick} getEventSelection={getEventSelection} />
                                </TabsContent>
                            </Tabs>
                        )}
                    </ScrollArea>
                </div>
            </DialogContent>
        </Dialog>
    );
}
