
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { EventCard } from '@/components/event-card';
import type { Event } from '@/components/event-carousel'; 
import { Loader2, ArrowLeft, Tv, Menu, Search, RotateCw, Settings, Play, X } from 'lucide-react';
import { EventSelectionDialog } from '@/components/event-selection-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { LayoutConfigurator } from '@/components/layout-configurator';


export function CategoryClientPage({ initialEvents, categoryName }: { initialEvents: Event[], categoryName: string }) {
  const router = useRouter();

  const [categoryEvents, setCategoryEvents] = useState<Event[]>(initialEvents);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [gridGap, setGridGap] = useState<number>(2);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const fetchCategoryEvents = useCallback(async () => {
    setIsLoading(true);
    try {
        const response = await fetch('/api/events', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data: Event[] = await response.json();
        
        const processedEvents = data.map(e => ({
          ...e,
          category: e.category.toLowerCase() === 'other' ? 'Otros' : e.category,
          status: e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1)) as Event['status'] : 'Desconocido',
        }));

        const filtered = processedEvents.filter(
          (event) => event.category.toLowerCase() === categoryName.toLowerCase()
        );

        const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2, 'Desconocido': 3, 'Finalizado': 4 };
        filtered.sort((a, b) => {
            const statusA = statusOrder[a.status] ?? 99;
            const statusB = statusOrder[b.status] ?? 99;
            if (statusA !== statusB) {
                return statusA - statusB;
            }
            return a.time.localeCompare(b.time);
        });
        setCategoryEvents(filtered);
    } catch (error) {
        console.error('Error fetching events:', error);
    } finally {
        setIsLoading(false);
    }
  }, [categoryName]);

  useEffect(() => {
    const storedSelectedEvents = localStorage.getItem('selectedEvents');
    if (storedSelectedEvents) {
      try {
        const parsedEvents = JSON.parse(storedSelectedEvents);
        if (Array.isArray(parsedEvents)) {
          const validEvents = parsedEvents.filter(Boolean);
          const newSelectedEvents = Array(9).fill(null);
          validEvents.slice(0, 9).forEach((event, i) => {
            newSelectedEvents[i] = event;
          });
          setSelectedEvents(newSelectedEvents);
        }
      } catch (e) {
        console.error("Failed to parse selectedEvents from localStorage", e);
      }
    }

    const storedViewOrder = localStorage.getItem('viewOrder');
    if (storedViewOrder) {
      try {
        const parsedOrder = JSON.parse(storedViewOrder);
        if (Array.isArray(parsedOrder) && parsedOrder.length === 9) {
          setViewOrder(parsedOrder);
        }
      } catch (e) {
        console.error("Failed to parse viewOrder from localStorage", e);
      }
    }

    const storedGap = localStorage.getItem('gridGap');
    if (storedGap) setGridGap(parseInt(storedGap, 10));

    const storedBorderColor = localStorage.getItem('borderColor');
    if (storedBorderColor) setBorderColor(storedBorderColor);

    const storedChatEnabled = localStorage.getItem('isChatEnabled');
    if (storedChatEnabled) setIsChatEnabled(JSON.parse(storedChatEnabled));
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
  }, [selectedEvents]);

   useEffect(() => {
    const activeEventIndexes = selectedEvents.map((e, i) => e ? i : -1).filter(i => i !== -1);
    const currentOrderActive = viewOrder.filter(i => activeEventIndexes.includes(i));
    
    const activeOrderChanged = JSON.stringify(currentOrderActive) !== JSON.stringify(viewOrder.filter(i => selectedEvents[i] !== null));

    if (activeOrderChanged) {
        const newOrder = [...currentOrderActive];
        for (let i = 0; i < 9; i++) {
            if (!newOrder.includes(i)) {
                newOrder.push(i);
            }
        }
        
        const stringifiedNewOrder = JSON.stringify(newOrder);
        if (stringifiedNewOrder !== localStorage.getItem('viewOrder')) {
            setViewOrder(newOrder);
            localStorage.setItem('viewOrder', stringifiedNewOrder);
        }
    }
  }, [selectedEvents, viewOrder]);

  const handleOrderChange = (newOrder: number[]) => {
    const fullNewOrder = [...newOrder];
    const presentIndexes = new Set(newOrder);
    for(let i=0; i<9; i++) {
        if(!presentIndexes.has(i)) {
            fullNewOrder.push(i);
        }
    }
    setViewOrder(fullNewOrder);
    localStorage.setItem('viewOrder', JSON.stringify(fullNewOrder));
  };


  const filteredEvents = useMemo(() => {
    return categoryEvents.filter(event => 
      event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categoryEvents, searchTerm]);

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
  };
  
  const getEventSelection = (event: Event) => {
    const selection = selectedEvents.map((se, i) => se && se.title === event.title ? i : null).filter(i => i !== null);
    if (selection.length > 0) {
      return { isSelected: true, window: selection[0]! + 1 };
    }
    return { isSelected: false, window: null };
  };

  const handleStartView = () => {
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
      setModificationIndex(selectedEvents.findIndex(e => e === null));
    }
    setDialogOpen(true);
  };

  const openDialogForModification = (event: Event, index: number) => {
    setConfigDialogOpen(false); // Close config dialog before opening event dialog
    setDialogEvent(event);
    setIsModification(true);
    setModificationIndex(index);
    setDialogOpen(true);
  }

  const selectedEventsCount = selectedEvents.filter(Boolean).length;

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-[75px] w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft />
          </Button>
          <h1 className="text-2xl font-bold capitalize">{categoryName}</h1>
        </div>
        <div className="flex items-center gap-2">
            <div className={cn("flex-1 justify-end", isSearchOpen ? 'flex' : 'hidden')}>
                <div className="relative w-full max-w-sm">
                    <Input
                        type="text"
                        placeholder="Buscar en esta categoría..."
                        className="w-full pr-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                     <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={fetchCategoryEvents}>
                        <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <Button variant="ghost" size="icon" onClick={() => {
                if (isSearchOpen) {
                    setSearchTerm('');
                }
                setIsSearchOpen(!isSearchOpen);
            }}>
                {isSearchOpen ? <X /> : <Search />}
            </Button>

            <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Settings />
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] flex flex-col">
                    <DialogHeader className="text-center">
                        <DialogTitle>Configuración y Eventos</DialogTitle>
                        <DialogDescription>
                            Personaliza la vista y gestiona tus eventos seleccionados.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="pr-4 -mr-4">
                       <LayoutConfigurator
                            gridGap={gridGap}
                            onGridGapChange={(value) => {
                                setGridGap(value);
                                localStorage.setItem('gridGap', value.toString());
                            }}
                            borderColor={borderColor}
                            onBorderColorChange={(value) => {
                                setBorderColor(value);
                                localStorage.setItem('borderColor', value);
                            }}
                            isChatEnabled={isChatEnabled}
                            onIsChatEnabledChange={(value) => {
                                setIsChatEnabled(value);
                                localStorage.setItem('isChatEnabled', JSON.stringify(value));
                            }}
                            order={viewOrder.filter(i => selectedEvents[i] !== null)}
                            onOrderChange={handleOrderChange}
                            eventDetails={selectedEvents}
                            onRemove={handleEventRemove}
                            onModify={openDialogForModification}
                            isViewPage={false}
                            onAddEvent={() => {}}
                        />
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <Button
                size="icon"
                onClick={handleStartView}
                disabled={selectedEventsCount === 0}
                className="bg-green-600 hover:bg-green-700 text-white relative"
            >
                <Play />
                 {selectedEventsCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 h-6 flex items-center justify-center rounded-full">
                        {selectedEventsCount}
                    </Badge>
                )}
            </Button>
        </div>
      </header>

      <main className="flex-grow overflow-y-auto p-4 md:p-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
          {filteredEvents.map((event, index) => (
            <EventCard
              key={`${event.title}-${index}`}
              event={event}
              selection={getEventSelection(event)}
              onClick={() => openDialogForEvent(event)}
            />
          ))}
        </div>
         {isLoading && categoryEvents.length > 0 && (
          <div className="flex w-full items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </main>

      {dialogEvent && (
        <EventSelectionDialog
          isOpen={dialogOpen}
          onOpenChange={setDialogOpen}
          event={dialogEvent}
          selectedEvents={selectedEvents}
          onSelect={handleEventSelect}
          isModification={isModification}
          onRemove={() => handleEventRemove(modificationIndex!)}
          windowNumber={(modificationIndex ?? selectedEvents.findIndex(e => e === null))! + 1}
        />
      )}
    </div>
  );
}
