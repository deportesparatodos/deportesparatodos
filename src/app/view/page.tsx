
"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X, ChevronDown, Loader2, Trash2, Plus, Settings } from "lucide-react";
import { Suspense, useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { ChannelListComponent } from '@/components/channel-list';
import type { Event } from '@/components/event-list';
import { EventListComponent } from '@/components/event-list';
import { addHours, isAfter } from 'date-fns';
import { channels as allChannels } from '@/components/channel-list';
import { useIsMobile } from '@/hooks/use-mobile';


const getDisplayStatus = (url: string, events: Event[], channelStatuses: Record<string, 'online' | 'offline'>): { text: string } => {
    if (!url || url.trim() === '') {
        return { text: "Elegir Canal…" };
    }
    
    if (events && events.length > 0) {
      for (const event of events) {
        const optionIndex = event.options.indexOf(url);
        if (optionIndex > -1 && event.buttons[optionIndex]) {
          return { text: event.buttons[optionIndex].toUpperCase() };
        }
      }
    }

    if (url.includes('ksdjugfsddeports.fun')) {
      const getStreamNameFromUrl = (u: string): string | null => {
        try {
            const urlObject = new URL(u);
            if (urlObject.hostname.includes('ksdjugfsddeports.fun')) {
                const pathParts = urlObject.pathname.split('/');
                const htmlFile = pathParts[pathParts.length - 1];
                if (htmlFile && htmlFile.endsWith('.html')) {
                    return htmlFile.slice(0, -5);
                }
            }
        } catch (e) {
            let match = u.match(/embed\/([^/]+)\.html/);
            if (match && match[1]) return match[1];
        }
        return null;
      };
      const streamName = getStreamNameFromUrl(url);
      if (streamName) {
        return { text: streamName.toUpperCase() };
      }
      return { text: 'STREAM VÁLIDO' };
    }

    const getStreamNameFromUrl = (u: string): string | null => {
        try {
            const urlObject = new URL(u);
            if (urlObject.hostname.includes('streamtpglobal.com')) {
                return urlObject.searchParams.get('stream');
            }
        } catch (e) {
            let match = u.match(/[?&]stream=([^&]+)/);
            if (match && match[1]) return match[1];
        }
        return null;
    };

    const streamName = getStreamNameFromUrl(url);

    if (streamName && channelStatuses && channelStatuses[streamName] === 'offline') {
        return { text: `CANAL INACTIVO (${streamName.toUpperCase()})` };
    }

    const foundChannel = allChannels.find(channel => channel.url === url);
    if (foundChannel) {
        return { text: foundChannel.name.toUpperCase() };
    }

    if (streamName) {
        return { text: streamName.toUpperCase() };
    }

    if (url.includes('youtube.com/embed/')) {
        return { text: "YOUTUBE" };
    }

    if (url) {
        return { text: "Canal del Usuario" };
    }

    return { text: "DESCONOCIDO" };
};


function ViewPageContent() {
  const searchParams = useSearchParams();
  const initialUrls: string[] = searchParams.getAll('urls').map((url: string) => decodeURIComponent(url));
  const gap = parseInt(searchParams.get('gap') || '0', 10);
  const borderColor = decodeURIComponent(searchParams.get('borderColor') || '#18181b');
  
  const [urls, setUrls] = useState<string[]>(initialUrls);
  const [visibleBarIndex, setVisibleBarIndex] = useState<number | null>(null);
  const [dialogOpenForIndex, setDialogOpenForIndex] = useState<number | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Data fetching state
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const isMobile = useIsMobile();


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

      const eventsWithStatus = events
        .map(e => {
            const eventStart = new Date(`${e.date}T${e.time}:00-03:00`);
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

  const handleMouseMove = (index: number) => {
    if (isMobile) return;
    setVisibleBarIndex(index);
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(() => {
      setVisibleBarIndex(null);
    }, 3000);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setVisibleBarIndex(null);
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
  };

  const handleUrlChange = (index: number, newUrl: string) => {
    const newUrls = [...urls];
    newUrls[index] = newUrl;
    setUrls(newUrls);
    setDialogOpenForIndex(null);
  };
  
  const handleRemoveWindow = (indexToRemove: number) => {
    setUrls(prevUrls => prevUrls.filter((_, index) => index !== indexToRemove));
  };
  
  const handleAddWindow = () => {
    setUrls(prevUrls => {
      if (prevUrls.length >= 9) {
        return prevUrls;
      }
      return [...prevUrls, ''];
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
  } else if (numIframes <= 4) {
    gridContainerClasses += " grid-cols-2 grid-rows-2";
  } else if (numIframes <= 6) {
    gridContainerClasses += " grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2";
  } else {
    gridContainerClasses += " grid-cols-3 grid-rows-3";
  }
  
  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground">
      <Link 
        href="/" 
        className="absolute top-2 right-2 z-20 p-2 rounded-md text-foreground hover:bg-accent/70 hover:text-accent-foreground transition-colors"
        aria-label="Cerrar Vista"
      >
        <X className="h-6 w-6" />
      </Link>
      
      <main 
        className={gridContainerClasses} 
        style={{ 
          gap: `${gap}px`,
          padding: `${gap}px`,
          backgroundColor: borderColor
        }}
      >
        <TooltipProvider>
          {urls.map((url: string, index: number) => {
            const isBarVisible = !isMobile && visibleBarIndex === index;
            const displayStatus = getDisplayStatus(url, processedEvents, channelStatuses);

            return (
              <div
                key={`${index}-${url}`}
                className={cn(
                  "bg-muted/50 overflow-hidden relative",
                  numIframes === 3 && index === 0 && "row-span-1 md:col-span-2"
                )}
                onMouseMove={isMobile ? undefined : () => handleMouseMove(index)}
                onMouseLeave={isMobile ? undefined : handleMouseLeave}
              >
                <iframe
                  src={url}
                  title={`Stream ${index + 1}`}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
                 <div
                  className={cn(
                    "absolute flex items-center gap-2 rounded-lg bg-black/50 p-1 backdrop-blur-sm",
                    isMobile 
                      ? "bottom-2 left-2 right-2"
                      : "top-2 left-2 right-2 transition-opacity duration-300",
                    !isMobile && (isBarVisible ? "opacity-100" : "opacity-0 pointer-events-none")
                  )}
                >
                  <Dialog open={dialogOpenForIndex === index} onOpenChange={(isOpen) => setDialogOpenForIndex(isOpen ? index : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-grow justify-between overflow-hidden">
                        <span className="truncate">{displayStatus.text}</span>
                        <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                        <DialogHeader className="p-5 pb-0">
                            <DialogTitle>Cambiar entrada para la Vista {index + 1}</DialogTitle>
                        </DialogHeader>
                         {isLoadingEvents || isLoadingStatuses ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            </div>
                        ) : (
                          <Tabs defaultValue="channels" className="w-full flex-grow flex flex-col overflow-hidden p-5 pt-2">
                              <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="channels">Canales</TabsTrigger>
                                  <TabsTrigger value="events">Eventos</TabsTrigger>
                              </TabsList>
                              <TabsContent value="channels" className="flex-grow overflow-hidden mt-0 data-[state=inactive]:hidden pt-5">
                                  <ChannelListComponent 
                                      channelStatuses={channelStatuses}
                                      isLoading={isLoadingStatuses}
                                      onSelectChannel={(newUrl) => handleUrlChange(index, newUrl)}
                                  />
                              </TabsContent>
                              <TabsContent value="events" className="flex-grow overflow-hidden mt-0 data-[state=inactive]:hidden pt-5">
                                  <EventListComponent 
                                    onSelectEvent={(newUrl) => handleUrlChange(index, newUrl)}
                                    events={processedEvents}
                                    isLoading={isLoadingEvents}
                                    error={eventsError}
                                  />
                              </TabsContent>
                          </Tabs>
                        )}
                    </DialogContent>
                  </Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon"
                        onClick={handleAddWindow}
                        aria-label="Agregar Ventana"
                        disabled={urls.length >= 9}
                        className="bg-green-500 text-primary-foreground hover:bg-green-500/90"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Agregar Ventana</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleRemoveWindow(index)}
                        aria-label="Eliminar Ventana"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar Ventana</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            );
          })}
        </TooltipProvider>
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
