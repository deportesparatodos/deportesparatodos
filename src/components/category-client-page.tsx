
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import type { Event } from '@/components/event-carousel'; 
import { Loader2, ArrowLeft, Tv } from 'lucide-react';
import { EventSelectionDialog } from './event-selection-dialog';

export function CategoryClientPage({ initialEvents, categoryName }: { initialEvents: Event[], categoryName: string }) {
  const router = useRouter();

  const [categoryEvents] = useState<Event[]>(initialEvents);
  const [isLoading] = useState(false);

  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [activeWindow, setActiveWindow] = useState(0);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);

  useEffect(() => {
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
    setIsModification(false);
    setModificationIndex(null);
    setDialogOpen(true);
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
          <Button variant="outline" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold capitalize">{categoryName}</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
                 <h3 className="text-sm font-semibold text-muted-foreground">Seleccionados:</h3>
                {selectedEvents.filter(Boolean).length > 0 && (
                    <div className="flex -space-x-4">
                        {selectedEvents.map((event, index) => event && (
                            <div key={index} className="relative h-12 w-auto rounded-md border-2 border-primary ring-2 ring-background aspect-video">
                                <Image
                                    src={event.image || 'https://placehold.co/100x150.png'}
                                    alt={event.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="rounded-md"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
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
          windowNumber={isModification ? modificationIndex! + 1 : activeWindow + 1}
        />
      )}
    </div>
  );
}
