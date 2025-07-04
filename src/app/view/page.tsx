
"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X, Loader2, Menu } from "lucide-react";
import { Suspense, useState, useEffect } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from '@/lib/utils';
import { channels as allChannels } from '@/components/channel-list';
import type { Event } from '@/components/event-list';
import { addHours, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CameraConfigurationComponent } from '@/components/camera-configuration';


function ViewPageContent() {
  const searchParams = useSearchParams();
  const initialUrls: string[] = searchParams.getAll('urls').map((url: string) => decodeURIComponent(url));
  const gap = parseInt(searchParams.get('gap') || '0', 10);
  const borderColor = decodeURIComponent(searchParams.get('borderColor') || '#18181b');
  
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [numCameras, setNumCameras] = useState<number>(initialUrls.length);
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const response = await fetch('https://agenda-dpt.vercel.app/api/events');
      if (!response.ok) {
        throw new Error('No se pudieron cargar los eventos.');
      }
      const data = await response.json();
      setEvents(data);
    } catch (err) {
      if (err instanceof Error) {
          setEventsError(err.message);
      } else {
          setEventsError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      setIsLoadingStatuses(true);
      try {
        const response = await fetch('https://corsproxy.io/?https%3A%2F%2Fstreamtpglobal.com%2Fstatus.json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const statuses = data.reduce((acc: Record<string, 'online' | 'offline'>, item: any) => {
          if (item.Canal) {
            acc[item.Canal] = item.Estado === 'Activo' ? 'online' : 'offline';
          }
          return acc;
        }, {});
        setChannelStatuses(statuses);
      } catch (error) {
        console.error("Failed to fetch channel statuses:", error);
      } finally {
        setIsLoadingStatuses(false);
      }
    };
    
    fetchStatuses();
    fetchEvents();
  }, []);

  useEffect(() => {
    const processAndSetEvents = () => {
      if (!events.length) {
        setProcessedEvents([]);
        return;
      }
      
      const now = new Date();
      const timeZone = 'America/Argentina/Buenos_Aires';

      const eventsWithStatus = events
        .map(e => {
            const eventStart = toZonedTime(`${e.date}T${e.time}`, timeZone);
            if (isNaN(eventStart.getTime())) {
              return { ...e, status: 'Finalizado' as const };
            }
            const eventEnd = addHours(eventStart, 3);
            
            let status: Event['status'] = 'Próximo';
            if (isAfter(now, eventEnd)) {
                status = 'Finalizado';
            } else if (isAfter(now, eventStart)) {
                status = 'En Vivo';
            }
            return { ...e, status };
        });

      const ongoingOrUpcomingEvents = eventsWithStatus.filter(
        e => e.status !== 'Finalizado'
      );

      const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2 };

      ongoingOrUpcomingEvents.sort((a, b) => {
          if (a.status !== b.status) {
              return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
          }
          return a.time.localeCompare(b.time);
      });

      setProcessedEvents(ongoingOrUpcomingEvents);
    };

    processAndSetEvents();
    const timerId = setInterval(processAndSetEvents, 60000);

    return () => clearInterval(timerId);
  }, [events]);

  useEffect(() => {
    if (urls.length !== numCameras) {
        setNumCameras(urls.length);
    }
  }, [urls.length]);


  const handleNumCamerasChange = (newNum: number) => {
    setNumCameras(newNum);
    setUrls(currentUrls => {
        if (currentUrls.length > newNum) {
            return currentUrls.slice(0, newNum);
        }
        if (currentUrls.length < newNum) {
            return [...currentUrls, ...Array(newNum - currentUrls.length).fill('')];
        }
        return currentUrls;
    });
  };

  if (urls.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
        <p className="mb-4">No se proporcionaron URLs de transmisión.</p>
        <Button asChild>
          <Link href="/">
            <X className="mr-2 h-4 w-4" /> Volver Atrás
          </Link>
        </Button>
      </div>
    );
  }

  const numIframes = urls.length;
  let gridContainerClasses = "grid flex-grow w-full h-full";

  if (numIframes === 1) {
    gridContainerClasses += " grid-cols-1 grid-rows-1";
  } else if (numIframes === 2) {
    gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
  } else if (numIframes === 3) {
    gridContainerClasses += " grid-cols-2 grid-rows-2";
  } else if (numIframes === 4) {
    gridContainerClasses += " grid-cols-2 grid-rows-2";
  } else if (numIframes <= 6) {
    gridContainerClasses += " grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2";
  } else {
    gridContainerClasses += " grid-cols-3 grid-rows-3";
  }

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground">
      <div className="absolute z-20 flex items-center gap-2" style={{ top: `${gap + 4}px`, right: `${gap + 4}px` }}>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
                <Button size="icon" variant="ghost" className="bg-transparent hover:bg-accent/80 text-white h-10 w-10">
                    <Menu className="h-5 w-5" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-96 flex flex-col p-0">
               <SheetHeader className="p-4 border-b">
                 <SheetTitle>Configuración de Vista</SheetTitle>
               </SheetHeader>
               <div className="flex-grow overflow-y-auto p-4">
                  {isLoadingEvents || isLoadingStatuses ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                   <CameraConfigurationComponent
                        numCameras={numCameras}
                        setNumCameras={handleNumCamerasChange}
                        cameraUrls={urls}
                        setCameraUrls={setUrls}
                        messages={[]}
                        setMessages={() => {}}
                        handleStartView={() => {}}
                        channels={allChannels}
                        channelStatuses={channelStatuses}
                        setCameraStatuses={() => {}}
                        setAcknowledged={() => {}}
                        isLoadingChannelStatuses={isLoadingStatuses}
                        events={processedEvents}
                        isLoadingEvents={isLoadingEvents}
                        eventsError={eventsError}
                        hideStartButton={true}
                        onRefreshEvents={fetchEvents}
                   />
                  )}
               </div>
            </SheetContent>
        </Sheet>
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
          gap: `${gap}px`,
          padding: `${gap}px`,
          backgroundColor: borderColor
        }}
      >
        {urls.map((url: string, index: number) => {
          
          const windowClasses: string[] = ["overflow-hidden", "relative", "bg-background"];
          if (!url) {
              windowClasses.push("bg-red-500", "flex", "items-center", "justify-center", "text-destructive-foreground", "font-bold");
          }
           if (urls.length === 3) {
            if (index === 0) {
              windowClasses.push("row-span-1 col-span-2");
            } else {
              windowClasses.push("col-span-1 row-span-1");
            }
          }
          
          return (
            <div
              key={`${index}-${url}`}
              className={cn(windowClasses)}
            >
              {url ? (
                <iframe
                  src={url}
                  title={`Stream ${index + 1}`}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                "ELEGIR CANAL/EVENTO..."
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
      <p>Cargando vistas...</p>
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
