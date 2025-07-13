
"use client";

import Link from 'next/link';
import { X, Loader2, MessageSquare } from "lucide-react";
import { Suspense, useState, useEffect, useMemo } from 'react';
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
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);

  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));

  const handleReloadCamera = (index: number) => {
    setReloadCounters(prevCounters => {
      const newCounters = [...prevCounters];
      newCounters[index] = (newCounters[index] || 0) + 1;
      return newCounters;
    });
  };

  const handleRemoveCamera = (indexToRemove: number) => {
    setSelectedEvents(prevEvents => {
        const newEvents = [...prevEvents];
        newEvents[indexToRemove] = null;
        localStorage.setItem('selectedEvents', JSON.stringify(newEvents));
        
        setViewOrder(prevOrder => {
            const currentActiveOrder = prevOrder.filter(i => newEvents[i] !== null);
            const newOrder = [...currentActiveOrder];
             // Add back the non-active indices to preserve the full order array length
            for (let i = 0; i < 9; i++) {
                if (!newOrder.includes(i) && newEvents[i] === null) {
                    newOrder.push(i);
                }
            }
            localStorage.setItem('viewOrder', JSON.stringify(newOrder));
            return newOrder;
        });

        return newEvents;
    });
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (welcomePopupOpen && !isSubDialogOpen) {
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
  }, [welcomePopupOpen, isSubDialogOpen]);

  useEffect(() => {
    setIsMounted(true);
    setWelcomePopupOpen(true);
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

  const activeEvents = useMemo(() => {
    return viewOrder
      .map(index => selectedEvents[index])
      .filter(event => event !== null) as Event[];
  }, [selectedEvents, viewOrder]);

  const numCameras = activeEvents.length;

  const urlsToDisplay = useMemo(() => {
      return viewOrder.map(originalIndex => {
        const event = selectedEvents[originalIndex];
        if (!event) return null;
        return {
          url: (event as any).selectedOption,
          originalIndex: originalIndex,
          reloadKey: reloadCounters[originalIndex] || 0,
        };
      }).filter(item => item !== null);
  }, [selectedEvents, viewOrder, reloadCounters]);


  if (!isMounted) {
    return <Loading />;
  }
  
  if (urlsToDisplay.filter(item => item?.url && item.url.trim() !== "").length === 0) {
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

  const getGridClasses = (count: number) => {
    if (count <= 1) return 'grid-cols-1 grid-rows-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1';
    if (count <= 4) return 'grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2';
    if (count <= 6) return 'grid-cols-1 md:grid-cols-3 grid-rows-6 md:grid-rows-2';
    if (count <= 9) return 'grid-cols-1 md:grid-cols-3 grid-rows-9 md:grid-rows-3';
    return 'grid-cols-1 grid-rows-1';
  };
  
  const gridContainerClasses = `grid flex-grow w-full h-full ${getGridClasses(numCameras)}`;


  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
       <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
          <DialogContent className="sm:max-w-md p-0" hideClose>
              <div className="relative">
                  <Progress value={progress} indicatorClassName="bg-primary" className="absolute top-0 left-0 right-0 h-1 rounded-none" />
              </div>
              <DialogHeader className="px-6 pt-8 pb-2 text-center">
                  <DialogTitle>¡Bienvenido a Deportes para Todos!</DialogTitle>
              </DialogHeader>
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
             order={viewOrder.filter(i => selectedEvents[i] !== null)}
             onOrderChange={handleOrderChange}
             eventDetails={selectedEvents}
             onReload={handleReloadCamera}
             onRemove={handleRemoveCamera}
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
          {urlsToDisplay.map((item, visualIndex) => {
            if (!item || !item.url) return null;
            
            const windowClasses: string[] = ["overflow-hidden", "relative", "bg-black"];
            
            let iframeSrc = item.url 
              ? `${item.url}${item.url.includes('?') ? '&' : '?'}reload=${item.reloadKey}`
              : '';

            if (iframeSrc.includes("youtube-nocookie.com")) {
                iframeSrc += `&autoplay=1`;
            }

            return (
              <div
                key={`${item.originalIndex}-${item.reloadKey}`}
                className={cn(windowClasses)}
              >
                <iframe
                  src={iframeSrc}
                  title={`Stream ${item.originalIndex + 1}`}
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
