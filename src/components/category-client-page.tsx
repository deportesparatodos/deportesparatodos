
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import type { Event } from '@/components/event-carousel'; 
import { Loader2, ArrowLeft, Tv, Menu } from 'lucide-react';
import { EventSelectionDialog } from './event-selection-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

export function CategoryClientPage({ initialEvents, categoryName }: { initialEvents: Event[], categoryName: string }) {
  const router = useRouter();

  const [categoryEvents] = useState<Event[]>(initialEvents);
  const [isLoading] = useState(false);

  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);


  useEffect(() => {
     const storedSelectedEvents = localStorage.getItem('selectedEvents');
      if (storedSelectedEvents) {
        setSelectedEvents(JSON.parse(storedSelectedEvents));
      }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
  }, [selectedEvents]);

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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold capitalize">{categoryName}</h1>
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
          {categoryEvents.map((event, index) => (
            <EventCard
              key={`${event.title}-${index}`}
              event={event}
              selection={getEventSelection(event)}
              onClick={() => openDialogForEvent(event)}
            />
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
          windowNumber={(isModification ? modificationIndex : selectedEvents.findIndex(e => e === null))! + 1}
        />
      )}
    </div>
  );
}
