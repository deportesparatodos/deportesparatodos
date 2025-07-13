
"use client";

import Link from 'next/link';
import { X, Loader2, MessageSquare } from "lucide-react";
import { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import type { Event } from '@/components/event-carousel';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Progress } from '@/components/ui/progress';

function ViewPageContent() {
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [isMounted, setIsMounted] = useState(false);
  const [gridGap, setGridGap] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useIsMobile();
  const [reloadCounters, setReloadCounters] = useState<number[]>(Array(9).fill(0));
  
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [progress, setProgress] = useState(100);

  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));
  const [orderedEventData, setOrderedEventData] = useState<(Event | null)[]>([]);

  const handleReloadCamera = (index: number) => {
    setReloadCounters(prevCounters => {
      const newCounters = [...prevCounters];
      newCounters[index] = (newCounters[index] || 0) + 1;
      return newCounters;
    });
  };

  const handleRemoveCamera = (indexToRemove: number) => {
    const newEvents = [...selectedEvents];
    newEvents[indexToRemove] = null;

    const newOrder = viewOrder.filter(i => newEvents[i] !== null);
    const availableSlots = Array.from({length: 9}, (_,i) => i).filter(i => !newOrder.includes(i));
    newOrder.push(...availableSlots);
    
    setSelectedEvents(newEvents);
    setViewOrder(newOrder);

    localStorage.setItem('selectedEvents', JSON.stringify(newEvents));
    localStorage.setItem('viewOrder', JSON.stringify(newOrder));
  };
  
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
  
  const numCameras = useMemo(() => selectedEvents.filter(Boolean).length, [selectedEvents]);
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (welcomePopupOpen) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            setWelcomePopupOpen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 100); 
    }
    return () => clearInterval(interval);
  }, [welcomePopupOpen]);

  useEffect(() => {
    setIsMounted(true);
    
    const hasVisited = localStorage.getItem('hasVisitedViewPage');
    if (!hasVisited) {
        setWelcomePopupOpen(true);
        localStorage.setItem('hasVisitedViewPage', 'true');
    }

    setProgress(100);

    const storedEvents = localStorage.getItem('selectedEvents');
    if (storedEvents) {
      const parsedEvents: (Event | null)[] = JSON.parse(storedEvents);
      const newSelectedEvents = Array(9).fill(null);
      parsedEvents.slice(0, 9).forEach((event, i) => {
        newSelectedEvents[i] = event;
      });
      setSelectedEvents(newSelectedEvents);
    }

    const storedGap = localStorage.getItem('gridGap');
    if (storedGap) {
      setGridGap(parseInt(storedGap, 10));
    }
    const storedBorderColor = localStorage.getItem('borderColor');
    if (storedBorderColor) {
      setBorderColor(storedBorderColor);
    }
    const storedChatEnabled = localStorage.getItem('isChatEnabled');
    if (storedChatEnabled) {
      setIsChatEnabled(JSON.parse(storedChatEnabled));
    }
    const storedViewOrder = localStorage.getItem('viewOrder');
    if (storedViewOrder) {
        try {
            const parsedOrder = JSON.parse(storedViewOrder);
            if(Array.isArray(parsedOrder) && parsedOrder.length === 9) {
                setViewOrder(parsedOrder);
            }
        } catch(e) {
            console.error("Failed to parse viewOrder from localStorage", e);
        }
    }
  }, []);

  useEffect(() => {
      const newOrderedEventData = viewOrder.map(index => selectedEvents[index] || null);
      setOrderedEventData(newOrderedEventData);
  }, [selectedEvents, viewOrder]);

  const getGridClasses = useCallback((count: number) => {
    if (isMobile) {
        return `grid-cols-1 grid-rows-${count}`;
    }
    switch (count) {
        case 1: return 'grid-cols-1 grid-rows-1';
        case 2: return 'grid-cols-2 grid-rows-1';
        case 3: return 'grid-cols-2 grid-rows-2';
        case 4: return 'grid-cols-2 grid-rows-2';
        case 5: return 'grid-cols-3 grid-rows-2';
        case 6: return 'grid-cols-3 grid-rows-2';
        case 7: return 'grid-cols-3 grid-rows-3';
        case 8: return 'grid-cols-3 grid-rows-3';
        case 9: return 'grid-cols-3 grid-rows-3';
        default: return 'grid-cols-1 grid-rows-1';
    }
  }, [isMobile]);
  
  const getItemClasses = useCallback((index: number, count: number) => {
      if (isMobile) return '';
      if (count === 3 && index === 0) return 'col-span-2';
      if (count === 5 && index < 2) return 'col-span-1';
      if (count === 5 && index >= 2) return 'col-span-1';
      return '';
  }, [isMobile]);


  if (!isMounted) {
    return <Loading />;
  }
  
  if (numCameras === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
        <p className="mb-4">No hay URLs seleccionadas para mostrar.</p>
        <Button asChild>
          <Link href="/">
            <X className="mr-2 h-4 w-4" /> Volver Atrás
          </Link>
        </Button>
      </div>
    );
  }
  
  const gridContainerClasses = `grid flex-grow w-full h-full ${getGridClasses(numCameras)}`;
  const orderedIndexes = viewOrder.filter(i => selectedEvents[i] !== null);

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
       <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
           <DialogContent className="sm:max-w-md p-0" hideClose>
              <DialogHeader className="sr-only">
                  <DialogTitle>Bienvenida</DialogTitle>
              </DialogHeader>
              <div className="relative">
                  <Progress value={progress} indicatorClassName="bg-primary" className="absolute top-0 left-0 right-0 h-1 rounded-none" />
              </div>
              <div className="px-6 pt-8 pb-2 text-center">
                  <h2 className="text-lg font-bold">¡Bienvenido a Deportes para Todos!</h2>
              </div>
              <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground text-left">
                  <p>Si encuentras algún problema o no estás seguro de cómo funciona algo, consulta nuestras guías rápidas.</p>
              </div>
          </DialogContent>
      </Dialog>

      <div className="relative flex flex-col h-screen flex-grow">
        <div
          className={cn(
            "absolute z-20 flex items-center gap-2",
            isChatOpen && !isMobile ? "flex-row-reverse left-0" : "right-0"
          )}
          style={
             isChatOpen && !isMobile 
              ? { top: `${gridGap}px`, left: `${gridGap}px` } 
              : { top: `${gridGap}px`, right: `${gridGap}px` }
          }
        >
          
          <CameraConfigurationComponent
             order={orderedIndexes}
             onOrderChange={handleOrderChange}
             eventDetails={selectedEvents}
             onReload={handleReloadCamera}
             onRemove={handleRemoveCamera}
             onModify={() => {}} 
             isViewPage={true}
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
          />

          {isChatEnabled && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="bg-transparent hover:bg-accent/80 text-white h-10 w-10" 
              onClick={() => setIsChatOpen(!isChatOpen)}
              aria-label="Abrir o cerrar chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
          
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "bg-transparent hover:bg-accent/80 text-white h-10 w-10")}
            aria-label="Cerrar Vista"
          >
            <X className="h-7 w-7 text-white" />
          </Link>
        </div>
        
        <main 
          className={gridContainerClasses} 
          style={{ 
            gap: `${gridGap}px`,
            padding: `${gridGap}px`,
            backgroundColor: borderColor
          }}
        >
          {Array.from({ length: 9 }).map((_, windowIndex) => {
              const event = orderedEventData[windowIndex];
              if (!event || !event.selectedOption) {
                  return <div key={`empty-${windowIndex}`} className="hidden" />;
              }
              const windowClasses = cn(
                  "overflow-hidden",
                  "relative",
                  "bg-black",
                  getItemClasses(windowIndex, numCameras)
              );

              let iframeSrc = event.selectedOption
                  ? `${event.selectedOption}${event.selectedOption.includes('?') ? '&' : '?'}reload=${reloadCounters[viewOrder[windowIndex]] || 0}`
                  : '';
              
              if (iframeSrc.includes("youtube-nocookie.com")) {
                  iframeSrc += `&autoplay=1`;
              }
              
              return (
                  <div key={`window-${viewOrder[windowIndex]}`} className={windowClasses}>
                      <iframe
                          src={iframeSrc}
                          title={`Stream ${viewOrder[windowIndex] + 1}`}
                          className="w-full h-full border-0"
                          allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                          allowFullScreen
                      />
                  </div>
              );
          })}
        </main>
      </div>
      
       {/* Chat Sidebar for Desktop */}
       <div
        className={cn(
          'w-80 flex-shrink-0 bg-background flex-col border-l border-border',
          isChatOpen && !isMobile ? 'flex' : 'hidden'
        )}
      >
        <div className="p-2 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold">Chat en Vivo</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <iframe
          src="https://organizations.minnit.chat/626811533994618/c/Main?embed"
          title="Chat en Vivo"
          className="w-full flex-grow border-0"
        />
      </div>

      {/* Chat Dialog for Mobile */}
      {isMobile && (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="p-0 border-0 w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader className="p-4 border-b">
                <DialogTitle>Chat en Vivo</DialogTitle>
            </DialogHeader>
            <iframe
              src="https://organizations.minnit.chat/626811533994618/c/Main?embed"
              title="Chat en Vivo"
              className="w-full flex-grow border-0"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2">Cargando vistas...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ViewPageContent />
    </Suspense>
  );
}
