
"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { X, ChevronDown, Loader2, Trash2, Plus, Menu } from "lucide-react";
import { Suspense, useState, useEffect, useRef } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { ChannelListComponent, channels as allChannels } from '@/components/channel-list';
import type { Event } from '@/components/event-list';
import { EventListComponent } from '@/components/event-list';
import { addHours, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useIsMobile } from '@/hooks/use-mobile';
import { CameraConfigurationComponent } from '@/components/camera-configuration';


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
  const [numCameras, setNumCameras] = useState<number>(initialUrls.length);
  const [visibleBarIndex, setVisibleBarIndex] = useState<number | null>(null);
  const [dialogOpenForIndex, setDialogOpenForIndex] = useState<number | null>(null);
  const inactivityTimer = useRef<NodeJS.Timeout | null>(null);
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeButtonWidth = 40;


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
    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
     inactivityTimer.current = setTimeout(() => {
      setVisibleBarIndex(null);
    }, 500);
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
  } else if (numIframes === 3) {
    gridContainerClasses += " grid-cols-2 grid-rows-2";
  } else if (numIframes === 4) {
    gridContainerClasses += " grid-cols-2 grid-rows-2";
  } else if (numIframes <= 6) {
    gridContainerClasses += " grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2";
  } else {
    gridContainerClasses += " grid-cols-3 grid-rows-3";
  }
  
  const getTopRightIndex = (numCameras: number, isMobile: boolean): number => {
    if (isMobile) return -1;
    if (numCameras === 3) return 0;
    if (numCameras === 1) return 0;
    if (numCameras === 2 || numCameras === 4) return 1;
    if (numCameras >= 5) return 2;
    return -1;
  };

  const topRightIndex = getTopRightIndex(urls.length, isMobile);

  return (
    <div className="relative flex flex-col h-screen bg-background text-foreground">
      <div className="absolute z-20 flex items-center h-10" style={{ top: `${gap + 2}px`, right: `${gap + 2}px` }}>
         {isMobile && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="h-10 w-10">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-96 flex flex-col p-0">
                   <SheetHeader className="p-4 border-b">
                     <SheetTitle>Configuración de Vista</SheetTitle>
                   </SheetHeader>
                   <div className="flex-grow overflow-y-auto p-4">
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
                       />
                   </div>
                </SheetContent>
            </Sheet>
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
          gap: `${gap}px`,
          padding: `${gap}px`,
          backgroundColor: borderColor
        }}
      >
        <TooltipProvider>
          {urls.map((url: string, index: number) => {
            const isBarVisible = !isMobile && (visibleBarIndex === index || !url);
            const displayStatus = getDisplayStatus(url, processedEvents, channelStatuses);
            const isTopRightWindow = index === topRightIndex;
            
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
                onMouseMove={isMobile ? undefined : () => handleMouseMove(index)}
                onMouseLeave={isMobile ? undefined : handleMouseLeave}
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
                 {!isMobile && (
                   <div
                    className={cn(
                      "absolute flex items-center bg-black/50 backdrop-blur-sm top-0 left-0 right-0 transition-opacity duration-300 h-14",
                      isBarVisible ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                  >
                    <div className={cn("flex-grow flex items-center gap-2 p-2", isTopRightWindow && `mr-[${closeButtonWidth + 4}px]`)}>
                        <Dialog open={dialogOpenForIndex === index} onOpenChange={(isOpen) => setDialogOpenForIndex(isOpen ? index : null)}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="flex-grow justify-between overflow-hidden h-10">
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
                            className="bg-green-500 text-primary-foreground hover:bg-green-500/90 h-10 w-10"
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
                             className="h-10 w-10"
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
                )}
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
