
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import type { Event } from '@/components/event-list'; 
import { Loader2, ArrowLeft, Tv } from 'lucide-react';

export function CategoryClientPage({ initialEvents, categoryName }: { initialEvents: Event[], categoryName: string }) {
  const router = useRouter();

  const [categoryEvents, setCategoryEvents] = useState<Event[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false); // Already loaded on server

  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [activeWindow, setActiveWindow] = useState(0);

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
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold capitalize">{categoryName}</h1>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
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
              onSelect={handleEventSelect}
              selection={getEventSelection(event)}
              activeWindow={activeWindow}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
