
"use client";

import Link from 'next/link';
import { X, Loader2, Menu, MessageSquare } from "lucide-react";
import { Suspense, useState, useEffect } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { channels as allChannels } from '@/components/channel-list';
import type { Event } from '@/components/event-list';
import { addHours, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { useIsMobile } from '@/hooks/use-mobile';


const defaultEventGrouping = {
  all: true,
  enVivo: true,
  otros: true,
  f1: true,
  mlb: true,
  nba: true,
  mundialDeClubes: true,
  deportesDeCombate: true,
  liga1: true,
  ligaPro: true,
  mls: true,
};

function normalizeEventTitleForKey(title: string): string {
    let normalized = title.toLowerCase();
    
    // 1. Remove prefixes like "Liga: ", "Copa: ", etc.
    normalized = normalized.replace(/.*: /,'').trim();

    // 2. Remove accents and diacritics
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 3. Specific replacements for abbreviations and common names
    const replacements: { [key: string]: string } = {
        'ee. uu.': 'estados unidos',
        'u.s.a.': 'estados unidos',
        'usa': 'estados unidos',
        "newell's old boys": 'newells',
        "newell’s old boys": 'newells', // Different apostrophe
        "newell's": 'newells',
        "newell’s": 'newells',
    };

    for (const [key, value] of Object.entries(replacements)) {
        // Escape special regex characters in the key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        normalized = normalized.replace(new RegExp(escapedKey, 'g'), value);
    }

    // 4. Split by 'vs', normalize each team, sort, and join
    const teams = normalized
        .split(/\s+vs\.?\s+/) // Handles ' vs ' and ' vs. ' with surrounding spaces
        .map(team => team.replace(/[^a-z0-9]/g, '')) // Remove all non-alphanumeric
        .filter(Boolean);

    if (teams.length < 2) {
        // Fallback for titles that don't contain 'vs'
        return normalized.replace(/[^a-z0-9]/g, '');
    }

    // 5. Sort teams alphabetically to handle "A vs B" and "B vs A"
    teams.sort();
    
    return teams.join('-');
}

function finalizeMerge(groupToMerge: Omit<Event, 'status'>[]): Omit<Event, 'status'> {
    if (groupToMerge.length === 1) return groupToMerge[0];

    const allOptions = new Map<string, string>(); // url -> button text
    let earliestTime = '23:59';
    let longestTitle = '';
    
    const preferredEvent = groupToMerge.find(e => e.source.includes('alangulotv')) || groupToMerge[0];

    groupToMerge.forEach(event => {
        if (event.time < earliestTime) {
            earliestTime = event.time;
        }
        if (event.title.length > longestTitle.length) {
            longestTitle = event.title;
        }
        event.options.forEach((opt, index) => {
            if (!allOptions.has(opt)) {
                allOptions.set(opt, event.buttons[index]);
            }
        });
    });

    return {
        ...preferredEvent,
        time: earliestTime,
        title: longestTitle,
        image: preferredEvent.image,
        source: preferredEvent.source,
        options: Array.from(allOptions.keys()),
        buttons: Array.from(allOptions.values()),
    };
}

function mergeDuplicateEvents(events: Omit<Event, 'status'>[]): Omit<Event, 'status'>[] {
  if (!events || events.length === 0) return [];

  const eventGroups = new Map<string, Omit<Event, 'status'>[]>();

  events.forEach(event => {
    const cleanTitleKey = normalizeEventTitleForKey(event.title);
    const key = `${event.date}-${cleanTitleKey}`;
    if (!eventGroups.has(key)) {
      eventGroups.set(key, []);
    }
    eventGroups.get(key)!.push(event);
  });
  
  const mergedEvents: Omit<Event, 'status'>[] = [];

  for (const group of eventGroups.values()) {
    if (group.length === 1) {
      mergedEvents.push(group[0]);
      continue;
    }

    group.sort((a, b) => a.time.localeCompare(b.time));
    
    let currentMergeGroup: Omit<Event, 'status'>[] = [group[0]];
    
    for (let i = 1; i < group.length; i++) {
        const lastEventInMergeGroup = currentMergeGroup[currentMergeGroup.length - 1];
        const nextEvent = group[i];
        
        const time1 = new Date(`${lastEventInMergeGroup.date}T${lastEventInMergeGroup.time}`);
        const time2 = new Date(`${nextEvent.date}T${nextEvent.time}`);
        const timeDiff = Math.abs(time1.getTime() - time2.getTime()) / (1000 * 60);

        if (timeDiff <= 30) {
            currentMergeGroup.push(nextEvent);
        } else {
            mergedEvents.push(finalizeMerge(currentMergeGroup));
            currentMergeGroup = [nextEvent];
        }
    }
    if (currentMergeGroup.length > 0) {
        mergedEvents.push(finalizeMerge(currentMergeGroup));
    }
  }

  mergedEvents.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  return mergedEvents;
}

function ViewPageContent() {
  // State is now driven by localStorage to sync with home page
  const [urls, setUrls] = useState<string[]>(Array(9).fill(''));
  const [numCameras, setNumCameras] = useState<number>(1);
  const [isMounted, setIsMounted] = useState(false);
  const [gridGap, setGridGap] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#18181b');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useIsMobile();
  const [eventGrouping, setEventGrouping] = useState(defaultEventGrouping);
  const [reloadCounters, setReloadCounters] = useState<number[]>(Array(9).fill(0));


  const [sheetOpen, setSheetOpen] = useState(false);
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const handleReloadCamera = (index: number) => {
    setReloadCounters(prevCounters => {
      const newCounters = [...prevCounters];
      newCounters[index] = (newCounters[index] || 0) + 1;
      return newCounters;
    });
  };

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    const storedUrls = localStorage.getItem('cameraUrls');
    if (storedUrls) {
      const parsedUrls = JSON.parse(storedUrls);
      const newUrls = Array(9).fill('');
      parsedUrls.slice(0, 9).forEach((url: string, i: number) => {
        newUrls[i] = url;
      });
      setUrls(newUrls);
    }
    const storedNumCameras = localStorage.getItem('numCameras');
    if (storedNumCameras) {
      setNumCameras(parseInt(storedNumCameras, 10));
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
    const storedEventGrouping = localStorage.getItem('eventGrouping');
    if (storedEventGrouping) {
      try {
        const parsed = JSON.parse(storedEventGrouping);
        if (typeof parsed === 'object' && parsed !== null && 'all' in parsed) {
          setEventGrouping({ ...defaultEventGrouping, ...parsed });
        }
      } catch (e) {
        console.error("Failed to parse eventGrouping from localStorage", e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cameraUrls', JSON.stringify(urls));
      localStorage.setItem('numCameras', numCameras.toString());
      localStorage.setItem('gridGap', gridGap.toString());
      localStorage.setItem('borderColor', borderColor);
      localStorage.setItem('isChatEnabled', JSON.stringify(isChatEnabled));
      localStorage.setItem('eventGrouping', JSON.stringify(eventGrouping));
    }
  }, [urls, numCameras, gridGap, borderColor, isChatEnabled, eventGrouping, isMounted]);

  const handleGridGapChange = (value: number[]) => {
    const newGap = value[0];
    setGridGap(newGap);
  };

  const handleBorderColorChange = (color: string) => {
    setBorderColor(color);
  };
  
  const handleRestoreDefaults = () => {
    const defaultGap = 0;
    const defaultColor = '#18181b'; 
    setGridGap(defaultGap);
    setBorderColor(defaultColor);
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
      const processedData = data.map((event: any) => ({
        ...event,
        options: event.options.map((option: string) =>
          option === 'https://p.alangulotv.space/?channel=disneysiestsenpcwindowsusaestaextensinsoloarg'
            ? 'https://p.alangulotv.space/?channel=transmi1'
            : option
        ),
      }));
      const merged = mergeDuplicateEvents(processedData);
      setEvents(merged);
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
            const eventStart = toZonedTime(`${e.date}T${e.time}:00`, timeZone);
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

  if (!isMounted) {
    return <Loading />;
  }
  
  const urlsToDisplay = urls.slice(0, numCameras);

  if (urlsToDisplay.filter(url => url && url.trim() !== "").length === 0) {
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

  const numIframes = numCameras;
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
    <div className="flex h-screen w-screen bg-background text-foreground">
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
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                  <Button size="icon" variant="ghost" className="bg-transparent hover:bg-accent/80 text-white h-10 w-10">
                      <Menu className="h-5 w-5" />
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-96 flex flex-col p-0">
                 <SheetHeader className="p-4 py-3 border-b">
                   <SheetTitle>Configuracion:</SheetTitle>
                 </SheetHeader>
                 <div className="overflow-y-auto p-4 flex-grow">
                    {isLoadingEvents || isLoadingStatuses ? (
                      <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <CameraConfigurationComponent
                            numCameras={numCameras}
                            setNumCameras={setNumCameras}
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
                            onReloadCamera={handleReloadCamera}
                            gridGap={gridGap}
                            borderColor={borderColor}
                            handleGridGapChange={handleGridGapChange}
                            handleBorderColorChange={handleBorderColorChange}
                            handleRestoreDefaults={handleRestoreDefaults}
                            isChatEnabled={isChatEnabled}
                            setIsChatEnabled={setIsChatEnabled}
                            eventGrouping={eventGrouping}
                            setEventGrouping={setEventGrouping}
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
            gap: `${gridGap}px`,
            padding: `${gridGap}px`,
            backgroundColor: borderColor
          }}
        >
          {urlsToDisplay.map((url: string, index: number) => {
            
            const windowClasses: string[] = ["overflow-hidden", "relative", "bg-background"];
            if (!url) {
                windowClasses.push("bg-red-500", "flex", "items-center", "justify-center", "text-destructive-foreground", "font-bold");
            }
             if (numIframes === 3) {
              if (index === 0) {
                windowClasses.push("row-span-1 col-span-2");
              } else {
                windowClasses.push("col-span-1 row-span-1");
              }
            }
            
            return (
              <div
                key={`${index}-${url}-${reloadCounters[index]}`}
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
