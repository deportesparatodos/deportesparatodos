

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
import { EventSelectionDialog } from './event-selection-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { parse, isValid, isBefore } from 'date-fns';

export function AddEventsDialog({ open, onOpenChange, onSelect, onRemove, selectedEvents, allEvents, allChannels, onFetchEvents, updateAllEvents, isFullScreen, setIsFullScreen }: { open: boolean, onOpenChange: (open: boolean) => void, onSelect: (event: Event, option: string) => void, onRemove: (event: Event) => void, selectedEvents: (Event|null)[], allEvents: Event[], allChannels: Channel[], onFetchEvents: () => Promise<void>, updateAllEvents: (events: Event[]) => void, isFullScreen: boolean, setIsFullScreen: (isFullScreen: boolean) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddEventsLoading, setIsAddEventsLoading] = useState(false);
    
    const [subDialogOpen, setSubDialogOpen] = useState(false);
    const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
    const [isSubDialogLoading, setIsSubDialogLoading] = useState(false);
    const [isModification, setIsModification] = useState(false);

    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setIsFullScreen(false); // Reset fullscreen state on close
        }
    }, [open, setIsFullScreen]);

    const handleForceFetch = async () => {
        setIsAddEventsLoading(true);
        await onFetchEvents();
        setIsAddEventsLoading(false);
    };

    const getEventSelection = useCallback((event: Event) => {
        const selectionIndex = selectedEvents.findIndex(se => se?.id === event.id);
        if (selectionIndex !== -1 && selectedEvents[selectionIndex]) {
            return { isSelected: true, selectedOption: selectedEvents[selectionIndex]!.selectedOption };
        }
        return { isSelected: false, selectedOption: null };
    }, [selectedEvents]);


    const handleSubDialogSelect = (event: Event, option: string) => {
        onSelect(event, option);
        setSubDialogOpen(false);
    };

    const handleSubDialogRemove = (event: Event) => {
        onRemove(event);
        setSubDialogOpen(false);
    };
    
    const openSubDialogForEvent = async (event: Event) => {
        const selection = getEventSelection(event);
        let eventForDialog = {...event};
        if(selection.isSelected && selection.selectedOption){
            eventForDialog.selectedOption = selection.selectedOption;
        }

        setIsSubDialogLoading(true);
        setDialogEvent(eventForDialog); // Set event immediately to show dialog
        setSubDialogOpen(true);

        setIsModification(selection.isSelected);
        
        if (event.source === 'streamed.pk' && event.options.length === 0) {
            try {
                const sourcePromises = event.sources.map(async (source) => {
                    try {
                        const response = await fetch(`/api/streams?type=stream&source=${source.source}&id=${source.id}`);
                        if (response.ok) {
                            const streams: any[] = await response.json();
                            if (Array.isArray(streams)) {
                                return streams.map(stream => ({
                                    url: stream.embedUrl,
                                    label: `${stream.language}${stream.hd ? ' HD' : ''} (${stream.source})`,
                                    hd: stream.hd,
                                    language: stream.language,
                                }));
                            }
                        }
                    } catch (e) {
                        console.error(`Failed to fetch stream source: ${source.source}/${source.id}`, e);
                    }
                    return [];
                });
                const results = await Promise.all(sourcePromises);
                const streamOptions: StreamOption[] = results.flat().filter(Boolean) as StreamOption[];

                const updatedEventForDialog = { ...eventForDialog, options: streamOptions };
                setDialogEvent(updatedEventForDialog);

                // Also update the main events array so we don't fetch again
                updateAllEvents(allEvents.map(e => e.id === updatedEventForDialog.id ? { ...e, options: streamOptions } : e));
            } catch (error) {
                console.error(`Failed to fetch streams for ${event.title}`);
                const updatedEventForDialog = { ...eventForDialog, options: [] };
                setDialogEvent(updatedEventForDialog);
            }
        }
        setIsSubDialogLoading(false);
    };

    const handleChannelClick = (channel: Channel) => {
        const event: Event = {
            id: `${channel.name}-channel-static`,
            title: channel.name,
            options: channel.urls,
            sources: [],
            buttons: [],
            time: 'AHORA',
            category: 'Canal',
            language: '',
            date: '',
            source: '',
            status: 'En Vivo',
            image: channel.logo,
        };
        const selection = getEventSelection(event);
        if (selection.isSelected) {
            const selectedEvent = selectedEvents.find(se => se?.id === event.id);
            if (selectedEvent) {
                event.selectedOption = selectedEvent.selectedOption;
            }
        }
        openSubDialogForEvent(event);
    };

    const sortedAndFilteredEvents = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const liveSortLogic = (a: Event, b: Event): number => a.title.localeCompare(b.title);
        
        const upcomingSortLogic = (a: Event, b: Event): number => {
            const now = new Date();
            const parseTime = (timeStr: string) => {
                if (!/^\d{2}:\d{2}$/.test(timeStr)) return null;
                const parsed = parse(timeStr, 'HH:mm', now);
                return isValid(parsed) ? parsed : null;
            };

            const timeA = parseTime(a.time);
            const timeB = parseTime(b.time);
            
            if (timeA && !timeB) return -1;
            if (!timeA && timeB) return 1;
            if (!timeA && !timeB) return a.title.localeCompare(b.title);
            
            const isPastA = isBefore(timeA!, now);
            const isPastB = isBefore(timeB!, now);
            
            if (isPastA && !isPastB) return 1;
            if (!isPastA && isPastB) return -1;
            
            return timeA!.getTime() - timeB!.getTime();
        };

        const placeholderImage = 'https://i.ibb.co/dHPWxr8/depete.jpg';
        const filtered = allEvents.filter(e => e.title.toLowerCase().includes(lowercasedFilter));

        const liveCustom = filtered.filter(e => e.status === 'En Vivo' && e.image && e.image !== placeholderImage).sort(liveSortLogic);
        const liveDefault = filtered.filter(e => e.status === 'En Vivo' && (!e.image || e.image === placeholderImage)).sort(liveSortLogic);
        const upcoming = filtered.filter(e => e.status === 'Próximo').sort(upcomingSortLogic);
        const unknown = filtered.filter(e => e.status === 'Desconocido').sort(upcomingSortLogic);
        const finished = filtered.filter(e => e.status === 'Finalizado').sort((a,b) => b.time.localeCompare(a.time));

        return [...liveCustom, ...liveDefault, ...upcoming, ...unknown, ...finished];
    }, [searchTerm, allEvents]);


    const filteredChannels = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return allChannels.filter(c => c.name.toLowerCase().includes(lowercasedFilter));
    }, [searchTerm, allChannels]);

    return (
        <Dialog open={open} onOpenChange={isOpen => { onOpenChange(isOpen); }}>
            <DialogContent 
                hideClose={true}
                className={cn(
                    "flex flex-col p-4 transition-all duration-300",
                    isFullScreen 
                        ? "w-screen h-screen max-w-none rounded-none" 
                        : "h-[90vh] sm:max-w-4xl"
                )}
            >
                <DialogHeader className='flex-row items-center justify-between pb-0'>
                    <DialogTitle>Añadir Evento/Canal</DialogTitle>
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)}>
                            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { onOpenChange(false); setIsFullScreen(false); }}>
                           <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>
                 
                <div className="relative flex-grow flex flex-col mt-2">
                    <Tabs defaultValue="eventos" className="flex-grow flex flex-col">
                        <div className="flex flex-col gap-2">
                            <div className="relative flex-grow mt-[5px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-20"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleForceFetch} disabled={isAddEventsLoading}>
                                        <RotateCw className={cn("h-5 w-5", isAddEventsLoading && "animate-spin")} />
                                    </Button>
                                    {searchTerm && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="eventos">Eventos</TabsTrigger>
                                <TabsTrigger value="canales">Canales</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="eventos" className="flex-grow mt-4 h-0">
                            <ScrollArea className="h-full pr-4 -mr-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {sortedAndFilteredEvents.map((event, index) => (
                                        <EventCard
                                            key={`${event.id}-${event.source}-${index}`}
                                            event={event}
                                            selection={getEventSelection(event)}
                                            onClick={() => openSubDialogForEvent(event)}
                                            displayMode="checkmark"
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="canales" className="flex-grow mt-4 h-0">
                            <ScrollArea className="h-full pr-4 -mr-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredChannels.map((channel, index) => {
                                        const channelAsEvent: Event = { id: `${channel.name}-channel-static`, title: channel.name, options: [], sources: [], buttons: [], time: 'AHORA', category: 'Canal', language: '', date: '', source: '', status: 'En Vivo', image: channel.logo };
                                        const selection = getEventSelection(channelAsEvent);
                                        return (
                                            <Card 
                                                key={`search-channel-${channel.name}-${index}`}
                                                className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border h-full w-full flex flex-col"
                                                onClick={() => handleChannelClick(channel)}
                                            >
                                                <div className="relative w-full aspect-video flex items-center justify-center p-2 bg-white h-[100px] flex-shrink-0">
                                                    <Image
                                                        src={channel.logo}
                                                        alt={`${channel.name} logo`}
                                                        width={120}
                                                        height={67.5}
                                                        className="object-contain max-h-full max-w-full"
                                                        onError={e => { e.currentTarget.src = 'https://i.ibb.co/dHPWxr8/depete.jpg'; }}
                                                    />
                                                    {selection.isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="hsl(142.1 76.2% 44.9%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check drop-shadow-lg"><path d="M20 6 9 17l-5-5"/></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 bg-card flex-grow flex flex-col justify-center">
                                                    <h3 className="font-bold text-sm text-center line-clamp-2">{channel.name}</h3>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    {isAddEventsLoading && (
                        <div className="absolute inset-0 bg-background flex items-center justify-center z-10 rounded-lg">
                            <Loader2 className="h-10 w-10 animate-spin" />
                        </div>
                    )}
                </div>
            </DialogContent>
            {dialogEvent && (
                <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                    <EventSelectionDialog
                        isOpen={subDialogOpen}
                        onOpenChange={setSubDialogOpen}
                        event={dialogEvent}
                        onSelect={handleSubDialogSelect}
                        isModification={isModification}
                        onRemove={() => handleSubDialogRemove(dialogEvent)}
                        isLoading={isSubDialogLoading}
                        setIsLoading={setIsSubDialogLoading}
                        setEventForDialog={setDialogEvent}
                    />
                </Dialog>
            )}
        </Dialog>
    );
}
