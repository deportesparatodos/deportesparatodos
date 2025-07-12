
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Tv, Menu, Search, RotateCw } from 'lucide-react';
import { EventSelectionDialog } from '@/components/event-selection-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Event } from '@/components/event-carousel';
import { channels as allChannels } from '@/components/channel-list';
import type { Channel } from '@/components/channel-list';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ChannelsPage() {
  const router = useRouter();
  const [channels] = useState<Channel[]>(allChannels);
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const storedSelectedEvents = localStorage.getItem('selectedEvents');
    if (storedSelectedEvents) {
      setSelectedEvents(JSON.parse(storedSelectedEvents));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
  }, [selectedEvents]);

  const filteredChannels = useMemo(() => {
    return channels.filter(channel => 
      channel.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [channels, searchTerm]);

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

  const openDialogForEvent = (event: Event) => {
    setDialogEvent(event);
    const targetIndex = selectedEvents.findIndex(e => e === null);
    if (targetIndex !== -1) {
      setIsModification(false);
      setModificationIndex(targetIndex);
    } else {
      // If all are full, allow modifying the first one
      setIsModification(true);
      setModificationIndex(0);
    }
    setDialogOpen(true);
  };

  const handleEventSelect = (event: Event, optionUrl: string) => {
    const newSelectedEvents = [...selectedEvents];
    const eventWithSelection = { ...event, selectedOption: optionUrl };

    let targetIndex = modificationIndex;
    if (targetIndex === null) {
      targetIndex = newSelectedEvents.findIndex(e => e === null);
    }

    if (targetIndex !== -1) {
      newSelectedEvents[targetIndex] = eventWithSelection;
      setSelectedEvents(newSelectedEvents);
    } else {
      console.log("All selection slots are full.");
    }

    setDialogOpen(false);
  };
  
  const handleEventRemove = (windowIndex: number) => {
    const newSelectedEvents = [...selectedEvents];
    newSelectedEvents[windowIndex] = null;
    setSelectedEvents(newSelectedEvents);
    setDialogOpen(false);
  };

  const handleStartView = () => {
    const urls = selectedEvents.map(e => e ? (e as any).selectedOption : '');
    localStorage.setItem('cameraUrls', JSON.stringify(urls));
    localStorage.setItem('numCameras', selectedEvents.filter(Boolean).length.toString());
    router.push('/view');
  };

  const openDialogForModification = (event: Event, index: number) => {
    setSheetOpen(false);
    setDialogEvent(event);
    setIsModification(true);
    setModificationIndex(index);
    setDialogOpen(true);
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-[75px] w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold capitalize">Canales</h1>
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
                className="bg-green-600 hover:bg-green-700 text-white my-[10px]"
            >
                <Tv className="mr-2 h-4 w-4" />
                Iniciar Vista ({selectedEvents.filter(Boolean).length})
            </Button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-8">
        <div className="mb-8 w-full">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    type="text"
                    placeholder="Buscar canal..."
                    className="w-full pl-10 pr-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => { /* No-op, visual only */ }}>
                    <RotateCw className="h-4 w-4" />
                </Button>
            </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
          {filteredChannels.map((channel, index) => (
             <Card 
                key={index}
                className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border"
                onClick={() => handleChannelClick(channel)}
            >
                <div className="relative w-full aspect-video flex items-center justify-center p-4 bg-white/10 h-[100px]">
                    <Image
                        src={channel.logo}
                        alt={`${channel.name} logo`}
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
                    <h3 className="font-bold truncate text-sm text-center">{channel.name}</h3>
                </div>
            </Card>
          ))}
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
          windowNumber={(modificationIndex ?? 0) + 1}
        />
      )}
    </div>
  );
}
