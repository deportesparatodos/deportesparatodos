
'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { EventCard } from './event-card';
import type { Event } from './event-carousel';
import { Card } from './ui/card';
import Image from 'next/image';
import type { Channel } from './channel-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';

interface RemoteAddEventsProps {
  onEventSelect: (event: Event) => void;
  onChannelClick: (channel: Channel) => void;
  getEventSelection: (event: Event) => { isSelected: boolean; selectedOption: string | null };
  allEvents: Event[];
  allChannels: Channel[];
  onClose: () => void;
}

export function RemoteAddEvents({ 
    onEventSelect,
    onChannelClick,
    getEventSelection,
    allEvents,
    allChannels,
    onClose,
}: RemoteAddEventsProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('events');

    const { sortedEvents, filteredChannels } = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const filteredEvents = allEvents.filter(event => event.title.toLowerCase().includes(lowercasedFilter));

        const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2, 'Desconocido': 3, 'Finalizado': 4 };
        const placeholderImage = 'https://i.ibb.co/dHPWxr8/depete.jpg';

        filteredEvents.sort((a, b) => {
            const statusA = statusOrder[a.status] ?? 5;
            const statusB = statusOrder[b.status] ?? 5;
            if (statusA !== statusB) return statusA - statusB;

            if (a.status === 'En Vivo') {
                const aHasCustomImage = a.image && a.image !== placeholderImage;
                const bHasCustomImage = b.image && b.image !== placeholderImage;
                if (aHasCustomImage && !bHasCustomImage) return -1;
                if (!aHasCustomImage && bHasCustomImage) return 1;
            }
            
            return a.title.localeCompare(b.title);
        });
        
        const filteredCh = allChannels.filter(channel => channel.name.toLowerCase().includes(lowercasedFilter));

        return { sortedEvents: filteredEvents, filteredChannels: filteredCh };
    }, [searchTerm, allEvents, allChannels]);


    return (
        <div className="fixed inset-0 z-[200] bg-background text-foreground flex flex-col p-4">
            <header className='flex-shrink-0 flex items-center justify-between pb-2 mb-2 border-b'>
                <h2 className="text-lg font-bold">Añadir Evento/Canal</h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </header>
             
            <div className="relative flex-grow flex flex-col">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow">
                    <div className="flex-shrink-0">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="events">Eventos</TabsTrigger>
                            <TabsTrigger value="channels">Canales</TabsTrigger>
                        </TabsList>
                    </div>
                    <ScrollArea className="flex-grow h-0 mt-4">
                        <TabsContent value="events" className="mt-0">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {sortedEvents.map((event, index) => (
                                    <EventCard key={`dialog-event-${event.id}-${index}`} event={event} selection={getEventSelection(event)} onClick={() => onEventSelect(event)} />
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="channels" className="mt-0">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                 {filteredChannels.map((channel, index) => {
                                    const channelAsEvent: Event = { id: `${channel.name}-channel-static`, title: channel.name, options: channel.urls.map(u => ({...u, hd: false, language: ''})), sources: [], buttons: [], time: 'AHORA', category: 'Canal', language: '', date: '', source: '', status: 'En Vivo', image: channel.logo };
                                    const selection = getEventSelection(channelAsEvent);
                                    return (
                                        <Card key={`dialog-channel-${index}`} onClick={() => onChannelClick(channel)} className="cursor-pointer group rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border border-border h-full w-full flex flex-col">
                                            <div className="relative w-full aspect-video flex items-center justify-center p-2 bg-white flex-shrink-0">
                                                 <Image src={channel.logo} alt={channel.name} fill className="object-contain" />
                                                  {selection.isSelected && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="hsl(142.1 76.2% 44.9%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check drop-shadow-lg"><path d="M20 6 9 17l-5-5"/></svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-3 bg-card flex-grow flex flex-col justify-center min-h-[52px]">
                                                <h3 className="font-bold text-sm text-center">{channel.name}</h3>
                                            </div>
                                        </Card>
                                    )
                                 })}
                            </div>
                        </TabsContent>
                    </ScrollArea>
                </Tabs>
            </div>
        </div>
    );
}
