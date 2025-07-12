
"use client";

import Link from 'next/link';
import { X, Loader2, Menu, MessageSquare, HelpCircle, AlertCircle, FileText, Mail, Settings } from "lucide-react";
import { Suspense, useState, useEffect, useMemo } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { channels as allChannels } from '@/components/channel-list';
import type { Event } from '@/components/event-list';
import { addHours, isAfter, format, parseISO, isValid } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ScheduledLayoutChange } from '@/components/schedule-manager';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';


const defaultEventGrouping = {
  all: false,
  enVivo: false,
  otros: false,
  f1: false,
  mlb: false,
  nba: false,
  mundialDeClubes: false,
  deportesDeCombate: false,
  deportesDeMotor: false,
  liga1: false,
  ligaPro: false,
  mls: false,
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
        // NBA Teams - Full name to short name
        'atlanta hawks': 'hawks',
        'boston celtics': 'celtics',
        'brooklyn nets': 'nets',
        'charlotte hornets': 'hornets',
        'chicago bulls': 'bulls',
        'cleveland cavaliers': 'cavaliers',
        'dallas mavericks': 'mavericks',
        'denver nuggets': 'nuggets',
        'detroit pistons': 'pistons',
        'golden state warriors': 'warriors',
        'houston rockets': 'rockets',
        'indiana pacers': 'pacers',
        'los angeles clippers': 'clippers',
        'la clippers': 'clippers',
        'los angeles lakers': 'lakers',
        'la lakers': 'lakers',
        'memphis grizzlies': 'grizzlies',
        'miami heat': 'heat',
        'milwaukee bucks': 'bucks',
        'minnesota timberwolves': 'timberwolves',
        'new orleans pelicans': 'pelicans',
        'new york knicks': 'knicks',
        'oklahoma city thunder': 'thunder',
        'orlando magic': 'magic',
        'philadelphia 76ers': '76ers',
        'phoenix suns': 'suns',
        'portland trail blazers': 'trail blazers',
        'sacramento kings': 'kings',
        'san antonio spurs': 'spurs',
        'toronto raptors': 'raptors',
        'utah jazz': 'jazz',
        'washington wizards': 'wizards',
    };

    // Apply main replacements first
    for (const [key, value] of Object.entries(replacements)) {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        normalized = normalized.replace(new RegExp(escapedKey, 'g'), value);
    }
    
    // 4. Split by 'vs', normalize each team, sort, and join
    let teams = normalized.split(/\s+vs\.?\s+/);

    // If 'vs' is not found, try splitting by space for cases like "TeamA TeamB"
    if (teams.length === 1) {
        teams = normalized.split(/\s+/);
    }

    teams = teams
        .map(team => team.replace(/[^a-z0-9]/g, '')) // Remove all non-alphanumeric
        .filter(Boolean); // Remove empty strings

    if (teams.length < 2) {
        // Fallback for titles that don't contain enough parts
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

const getOrderClass = (order: number) => {
    switch (order) {
        case 1: return "order-1";
        case 2: return "order-2";
        case 3: return "order-3";
        case 4: return "order-4";
        case 5: return "order-5";
        case 6: return "order-6";
        case 7: return "order-7";
        case 8: return "order-8";
        case 9: return "order-9";
        default: return "order-none";
    }
};

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
  const [scheduledChanges, setScheduledChanges] = useState<ScheduledLayoutChange[]>([]);
  
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));

  const handleReloadCamera = (index: number) => {
    setReloadCounters(prevCounters => {
      const newCounters = [...prevCounters];
      newCounters[index] = (newCounters[index] || 0) + 1;
      return newCounters;
    });
  };

  // Welcome Popup Timer
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
      }, 100); // Update every 100ms for 10s total
    }
    return () => clearInterval(interval);
  }, [welcomePopupOpen, isSubDialogOpen]);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    setWelcomePopupOpen(true);
    setProgress(100);

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
    const storedScheduledChanges = localStorage.getItem('scheduledChanges');
    if (storedScheduledChanges) {
        try {
            const parsedChanges: ScheduledLayoutChange[] = JSON.parse(storedScheduledChanges);
            const now = new Date();

            const upcomingChanges = parsedChanges.filter(change => {
                if (!change.date || !change.time) return false; // Discard invalid/old entries
                const scheduledDateTime = new Date(`${change.date}T${change.time}`);
                return scheduledDateTime >= now;
            });

            setScheduledChanges(upcomingChanges);
            
            if (upcomingChanges.length !== parsedChanges.length) {
                localStorage.setItem('scheduledChanges', JSON.stringify(upcomingChanges));
            }
        } catch (e) {
            console.error("Failed to parse or filter scheduledChanges from localStorage", e);
        }
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

  // Save to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cameraUrls', JSON.stringify(urls));
      localStorage.setItem('numCameras', numCameras.toString());
      localStorage.setItem('gridGap', gridGap.toString());
      localStorage.setItem('borderColor', borderColor);
      localStorage.setItem('isChatEnabled', JSON.stringify(isChatEnabled));
      localStorage.setItem('eventGrouping', JSON.stringify(eventGrouping));
      localStorage.setItem('scheduledChanges', JSON.stringify(scheduledChanges));
      localStorage.setItem('viewOrder', JSON.stringify(viewOrder));
    }
  }, [urls, numCameras, gridGap, borderColor, isChatEnabled, eventGrouping, scheduledChanges, viewOrder, isMounted]);

  // Scheduler Execution Logic
  useEffect(() => {
    if (!isMounted) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      
      const dueChanges = scheduledChanges.filter(change => {
        if (!change.date || !change.time) return false;
        const scheduledDateTime = new Date(`${change.date}T${change.time}`);
        return now >= scheduledDateTime;
      });

      if (dueChanges.length > 0) {
        dueChanges.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
        const changeToApply = dueChanges[dueChanges.length - 1];

        setNumCameras(changeToApply.numCameras);
        
        const newUrls = Array(9).fill('');
        changeToApply.urls.forEach((url, i) => {
            if (i < newUrls.length) {
                newUrls[i] = url;
            }
        });
        setUrls(newUrls);
        
        // Reset order on scheduled change
        const defaultOrder = Array.from({ length: 9 }, (_, i) => i);
        setViewOrder(defaultOrder);

        const upcomingChanges = scheduledChanges.filter(change => {
          if (!change.date || !change.time) return false;
          const scheduledDateTime = new Date(`${change.date}T${change.time}`);
          return now < scheduledDateTime;
        });
        setScheduledChanges(upcomingChanges);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [isMounted, scheduledChanges]);

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
      
      const filteredData = data.filter((event: any) => 
          event.time && event.time !== 'NaN:NaN' &&
          !event.options?.some((opt: string) => opt?.includes('/offline/offline.php'))
      );

      const processedData = filteredData.map((event: any) => {
        const newButtons = [...(event.buttons || [])];
        const newOptions = (event.options || []).map((option: string, index: number) => {
          let currentOption = option;
          
          if (currentOption === 'https://p.alangulotv.space/?channel=disneysiestsenpcwindowsusaestaextensinsoloarg') {
            currentOption = 'https://p.alangulotv.space/?channel=transmi1';
          }

          if (currentOption && typeof currentOption === 'string' && currentOption.includes('streamtpglobal.com')) {
              try {
                  const url = new URL(currentOption);
                  const streamParam = url.searchParams.get('stream');
                  if (streamParam) {
                      newButtons[index] = streamParam.toUpperCase();
                  }
              } catch (e) {
                  // Not a valid URL, ignore
              }
          }
          return currentOption;
        });

        const newEvent = {
            ...event,
            options: newOptions,
            buttons: newButtons,
        };
        
        const ecdfImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Football_of_Ecuador_-_Liga_Pro_logo_%28mini%29.svg/1200px-Football_of_Ecuador_-_Liga_Pro_logo_%28mini%29.svg.png';
        if (newEvent.buttons?.some((b: string) => b?.toLowerCase() === 'ecdf')) {
          newEvent.image = ecdfImage;
        }

        // Force image for embedstreams.top
        if (newEvent.options.some((opt: string) => opt.startsWith('https://embedstreams.top'))) {
            newEvent.image = 'https://cdn-icons-png.flaticon.com/512/9192/9192710.png';
        }

        if (!newEvent.image) {
          newEvent.image = 'https://cdn-icons-png.flaticon.com/512/9192/9192710.png';
        }

        return newEvent;
      });
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
      
      const timeZone = 'America/Argentina/Buenos_Aires';
      const now = toZonedTime(new Date(), timeZone);
      const currentHour = now.getHours();

      const eventsWithStatus = events
        .map(e => {
            // Force 'En Vivo' for embedrun.store and embedstreams.top links
            if (e.options.some(opt => opt.includes('embedrun.store') || opt.includes('embedstreams.top'))) {
                return { ...e, status: 'En Vivo' as const };
            }

            // Handle 24/7 events first, they are always 'En Vivo'
            if (e.title.includes('24/7')) {
              return { ...e, status: 'En Vivo' as const };
            }
            
            // Calculate start and end times for all other events
            let eventStartStr = `${e.date}T${e.time}:00`;
            if (e.time.match(/^\d{10}$/)) { // Check if time is a unix timestamp
                 eventStartStr = new Date(parseInt(e.time, 10) * 1000).toISOString();
            }
            const eventStart = toZonedTime(parseISO(eventStartStr), timeZone);

            if (!isValid(eventStart)) {
              return { ...e, status: 'Finalizado' as const };
            }
            
            let durationInHours = 3; // Default duration
            const durationMatch = e.title.match(/(\d+)\s*(?:hs|horas)/i);
            if (durationMatch && durationMatch[1]) {
                durationInHours = parseInt(durationMatch[1], 10) + 1;
            }
            const eventEnd = addHours(eventStart, durationInHours);
            
            let theoreticalStatus: Event['status'];
            if (isAfter(now, eventEnd)) {
                theoreticalStatus = 'Finalizado';
            } else if (isAfter(now, eventStart)) {
                theoreticalStatus = 'En Vivo';
            } else {
                theoreticalStatus = 'Próximo';
            }

            // Apply the "Desconocido" override only if the event is not already 'En Vivo' or 'Finalizado'
            if (theoreticalStatus === 'Próximo' && (currentHour >= 21 || currentHour < 6)) {
                return { ...e, status: 'Desconocido' as const };
            }

            return { ...e, status: theoreticalStatus };
        });

      setProcessedEvents(eventsWithStatus);
    };

    processAndSetEvents();
    const timerId = setInterval(processAndSetEvents, 60000);

    return () => clearInterval(timerId);
  }, [events]);
  
  const urlsToDisplay = useMemo(() => {
      const activeUrls = urls.slice(0, numCameras);
      return activeUrls.map((url, index) => ({
          url,
          originalIndex: index,
          reloadKey: reloadCounters[index] || 0,
      }));
  }, [urls, numCameras, reloadCounters]);


  if (!isMounted) {
    return <Loading />;
  }
  
  if (urlsToDisplay.filter(item => item.url && item.url.trim() !== "").length === 0) {
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

  switch (numIframes) {
    case 1:
      gridContainerClasses += " grid-cols-1 grid-rows-1";
      break;
    case 2:
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
      break;
    case 3:
      // Special responsive layout for 3 windows
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 md:grid-rows-2";
      break;
    case 4:
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2";
      break;
    case 6:
      gridContainerClasses += " grid-cols-1 md:grid-cols-3 grid-rows-6 md:grid-rows-2";
      break;
    case 9:
      gridContainerClasses += " grid-cols-1 md:grid-cols-3 grid-rows-9 md:grid-rows-3";
      break;
    default:
      gridContainerClasses += " grid-cols-1 grid-rows-1";
  }


  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
       <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
          <DialogContent className="sm:max-w-md p-0">
              <div className="relative">
                  <Progress value={progress} indicatorClassName="bg-primary" className="absolute top-0 left-0 right-0 h-1 rounded-none" />
              </div>
              <DialogHeader className="px-6 pt-8 pb-2 text-center">
                  <DialogTitle>¡Bienvenido a Deportes para Todos!</DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground text-left">
                  <p>Si encuentras algún problema o no estás seguro de cómo funciona algo, consulta nuestras guías rápidas.</p>
              </div>
              <DialogFooter className="flex-row items-center justify-center gap-2 p-6 pt-0">
                  <Dialog onOpenChange={(open) => setIsSubDialogOpen(open)}>
                      <DialogTrigger asChild>
                          <Button variant="outline"><HelpCircle className="mr-2 h-4 w-4" />Tutorial</Button>
                      </DialogTrigger>
                       <DialogContent className="max-w-3xl">
                          <DialogHeader>
                              <DialogTitle>Guía Completa de Uso</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                              <p>
                                  ¡Bienvenido a <strong>Deportes para Todos</strong>! Esta guía detallada te convertirá en un experto en el uso de la plataforma para que no te pierdas ni un segundo de la acción.
                              </p>

                              <h4 className="font-semibold text-foreground pt-2">Paso 1: Configura tu Espacio de Visualización</h4>
                              <p>
                                  Lo primero es decidir cuántas transmisiones quieres ver. Usa el menú desplegable que dice <strong>"Seleccionar cantidad de ventanas"</strong> para elegir entre 1, 2, 3, 4, 6 o 9 ventanas simultáneas. Tu selección determinará cuántos espacios de video se mostrarán.
                              </p>

                              <h4 className="font-semibold text-foreground pt-2">Paso 2: Asigna Canales y Eventos a tus Vistas</h4>
                              <p>
                                  Para cada ventana disponible, verás un botón que dice <strong>"Elegir Canal…"</strong>. Al hacer clic, se abrirá un diálogo con varias opciones:
                              </p>
                              <ul className="list-disc pl-6 space-y-2">
                                  <li>
                                      <strong>Pestaña "Canales":</strong> Aquí encontrarás una lista de canales de TV disponibles 24/7. Puedes usar la barra de búsqueda para encontrar uno rápidamente. Junto a cada canal verás un indicador de estado:
                                      <ul className="list-decimal pl-6 mt-1">
                                          <li><span className="text-green-500 font-bold">Verde:</span> El canal está activo y funcionando.</li>
                                          <li><span className="text-red-500 font-bold">Rojo:</span> El canal está inactivo o podría no funcionar.</li>
                                          <li><span className="text-gray-500 font-bold">Gris:</span> Estado desconocido, podría funcionar o no.</li>
                                      </ul>
                                  </li>
                                  <li><strong>Pestaña "Eventos":</strong> Una agenda con los partidos y eventos del día. Puedes buscar por equipo, liga o deportista. Los eventos también muestran su estado: "En Vivo", "Próximo" o "Finalizado".</li>
                                  <li>
                                      <strong>Pegar Enlace:</strong> Si tienes un enlace de video compatible (M3U8, MPD, etc.), puedes pegarlo directamente usando el botón <strong className="text-foreground">"Pega aqui tu enlace!"</strong> que aparece al principio de la lista de canales.
                                  </li>
                              </ul>
                              <p>
                                  Simplemente haz clic en <strong>"Seleccionar"</strong> en el canal o evento que desees para asignarlo a la ventana activa.
                              </p>

                              <h4 className="font-semibold text-foreground pt-2">Paso 3: Gestiona tus Vistas</h4>
                              <p>
                                  Una vez que has asignado contenido a una vista, tienes varias herramientas para gestionarla:
                              </p>
                              <ul className="list-disc pl-6 space-y-1">
                                  <li><strong>Flechas (Arriba/Abajo):</strong> Reordena las ventanas a tu gusto.</li>
                                  <li><strong>Botón "X":</strong> Limpia la selección de una ventana para dejarla vacía.</li>
                                  <li><strong>Botón de Recarga (en la página de visualización):</strong> Si una transmisión se congela o falla, usa este botón para recargarla sin afectar las demás.</li>
                                  </ul>

                              <h4 className="font-semibold text-foreground pt-2">Paso 4: Inicia la Sala de Control</h4>
                              <p>
                                  Cuando tengas todo listo, presiona el gran botón <strong>"Iniciar Vista"</strong>. Serás redirigido a la página de visualización donde verás todas tus selecciones en la cuadrícula que configuraste.
                              </p>

                              <h4 className="font-semibold text-foreground pt-2">Configuraciones Avanzadas (Menú <Settings className="inline-block h-4 w-4" />)</h4>
                              <p>
                                  Personaliza aún más tu experiencia desde el menú de Configuración:
                              </p>
                              <ul className="list-disc pl-6 space-y-1">
                                  <li><strong>Bordes:</strong> Ajusta el grosor y el color del espacio entre las ventanas de video para una mejor separación visual.</li>
                                  <li><strong>Chat:</strong> Activa o desactiva el chat en vivo global, disponible en la página de visualización.</li>
                                  <li><strong>Eventos:</strong> Controla cómo se agrupan los eventos en la lista. Puedes agruparlos por competición (F1, NBA, etc.) o verlos todos juntos.</li>
                                   <li><strong>Programar Selección:</strong> ¿Un partido empieza más tarde? Puedes programar un cambio de diseño para una fecha y hora específicas. La aplicación cambiará automáticamente las ventanas y canales a la hora programada.</li>
                              </ul>
                               <h4 className="font-semibold text-foreground pt-2">Consejos Útiles</h4>
                              <ul className="list-disc pl-6 space-y-1">
                                  <li>La aplicación guarda automáticamente tus selecciones de canales y configuraciones, ¡no necesitas guardarlas manualmente!</li>
                                   <li>Si un video no carga, prueba recargando la vista específica o consulta la sección de "Errores" para soluciones comunes como cambiar el DNS.</li>
                                   <li>Para cualquier problema o sugerencia, no dudes en usar la opción de "Contacto".</li>
                              </ul>
                          </div>
                      </DialogContent>
                  </Dialog>
                  <Dialog onOpenChange={(open) => setIsSubDialogOpen(open)}>
                      <DialogTrigger asChild>
                          <Button variant="outline"><AlertCircle className="mr-2 h-4 w-4" />Errores</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                          <DialogHeader>
                              <DialogTitle>Solución de Errores Comunes</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6 text-sm text-muted-foreground">
                            <p>
                                A continuación, te presentamos una guía detallada para resolver los problemas más frecuentes que podrías encontrar al intentar reproducir videos. Sigue estos pasos en orden para maximizar las chances de éxito.
                            </p>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-foreground">1. Configurar un DNS público (Cloudflare o Google)</h4>
                                <p>
                                    <strong>El Problema:</strong> Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios o servidores de video a través de su DNS. Esto provoca que el video nunca cargue y veas una pantalla negra o un error de conexión.
                                </p>
                                <p>
                                    <strong>La Solución:</strong> Cambiar el DNS de tu dispositivo o router a uno público como el de Cloudflare (<a href="https://one.one.one.one" target="_blank" rel="noopener noreferrer" className="text-primary underline">1.1.1.1</a>) o Google (8.8.8.8) puede saltarse estas restricciones. Estos servicios son gratuitos, rápidos y respetan tu privacidad. Este es el método más efectivo y soluciona la mayoría de los casos.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-foreground">2. Instalar una Extensión de Reproductor de Video</h4>
                                <p>
                                    <strong>El Problema:</strong> Algunos streams de video utilizan formatos modernos como M3U8 o MPD que no todos los navegadores soportan de forma nativa. Si el navegador no sabe cómo "leer" el formato, el video no se reproducirá.
                                </p>
                                <p>
                                    <strong>La Solución:</strong> Instalar una extensión como <a href="https://chromewebstore.google.com/detail/reproductor-mpdm3u8m3uepg/opmeopcambhfimffbomjgemehjkbbmji?hl=es" target="_blank" rel="noopener noreferrer" className="text-primary underline">"Reproductor MPD/M3U8/M3U/EPG"</a> (para Chrome/Edge) le da a tu navegador las herramientas necesarias para decodificar y reproducir estos formatos. Actúa como un "traductor" que le enseña a tu navegador a manejar estos videos.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-foreground">3. Cambiar de Navegador</h4>
                                <p>
                                    <strong>El Problema:</strong> A veces, las configuraciones específicas de un navegador, una actualización reciente o una extensión conflictiva pueden impedir la reproducción.
                                </p>
                                <p>
                                    <strong>La Solución:</strong> Probar con un navegador diferente es una forma rápida de descartar problemas locales. Recomendamos usar las versiones más recientes de <strong>Google Chrome</strong>, <strong>Mozilla Firefox</strong> o <strong>Microsoft Edge</strong>, ya que suelen tener la mejor compatibilidad con tecnologías de video web.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-foreground">4. Desactivar Bloqueadores de Anuncios (Adblockers)</h4>
                                <p>
                                    <strong>El Problema:</strong> Los bloqueadores de anuncios son muy útiles, pero a veces pueden ser demasiado agresivos. Pueden bloquear no solo los anuncios, sino también los scripts o reproductores de video necesarios para que la transmisión funcione.
                                </p>
                                <p>
                                    <strong>La Solución:</strong> Intenta desactivar tu Adblocker (como AdBlock, uBlock Origin, etc.) temporalmente para este sitio web. La mayoría de estas extensiones te permiten añadir sitios a una "lista blanca" para que no actúen sobre ellos. Recarga la página después de desactivarlo.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-foreground">5. Optimizar para Escritorio</h4>
                                <p>
                                    <strong>El Problema:</strong> La aplicación está diseñada y optimizada para la experiencia en una computadora de escritorio o portátil. Los dispositivos móviles (celulares, tabletas) tienen limitaciones de hardware y software que pueden causar errores de reproducción o problemas de rendimiento.
                                </p>
                                <p>
                                    <strong>La Solución:</strong> Para una experiencia más estable y fluida, recomendamos encarecidamente usar la plataforma en una computadora. Esto asegura que haya suficientes recursos para manejar múltiples transmisiones de video simultáneamente.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-semibold text-foreground">6. Reiniciar el Dispositivo y la Red</h4>
                                <p>
                                    <strong>El Problema:</strong> Problemas temporales de software, caché acumulada o fallos en la conexión de red pueden impedir que el contenido cargue correctamente.
                                </p>
                                <p>
                                    <strong>La Solución:</strong> El clásico "apagar y volver a encender". Un reinicio rápido de tu computadora y de tu router puede solucionar problemas transitorios de red, memoria o software que podrían estar afectando la reproducción de video.
                                </p>
                            </div>
                          </div>
                      </DialogContent>
                  </Dialog>
              </DialogFooter>
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
                   <SheetTitle>Configuración:</SheetTitle>
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
                            setCameraUrls={(action) => {
                                const newUrls = typeof action === 'function' ? action(urls) : action;
                                setUrls(newUrls);
                                // When URLs change from here, reset the order
                                setViewOrder(Array.from({ length: 9 }, (_, i) => i));
                            }}
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
                            handleBorderColorChange={handleRestoreDefaults}
                            isChatEnabled={isChatEnabled}
                            setIsChatEnabled={setIsChatEnabled}
                            eventGrouping={eventGrouping}
                            setEventGrouping={setEventGrouping}
                            scheduledChanges={scheduledChanges}
                            setScheduledChanges={setScheduledChanges}
                            viewOrder={viewOrder}
                            onReorder={setViewOrder}
                      />
                    )}
                 </div>
                 <div className="p-4 border-t space-y-2 shrink-0">
                     <Dialog>
                          <DialogTrigger asChild>
                              <Button variant="outline" className="justify-start w-full">
                                  <HelpCircle className="mr-2 h-4 w-4" />
                                  Tutorial
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                  <DialogTitle>Guía Completa de Uso</DialogTitle>
                              </DialogHeader>
                              <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                                  <p>
                                      ¡Bienvenido a <strong>Deportes para Todos</strong>! Esta guía detallada te convertirá en un experto en el uso de la plataforma para que no te pierdas ni un segundo de la acción.
                                  </p>

                                  <h4 className="font-semibold text-foreground pt-2">Paso 1: Configura tu Espacio de Visualización</h4>
                                  <p>
                                      Lo primero es decidir cuántas transmisiones quieres ver. Usa el menú desplegable que dice <strong>"Seleccionar cantidad de ventanas"</strong> para elegir entre 1, 2, 3, 4, 6 o 9 ventanas simultáneas. Tu selección determinará cuántos espacios de video se mostrarán.
                                  </p>

                                  <h4 className="font-semibold text-foreground pt-2">Paso 2: Asigna Canales y Eventos a tus Vistas</h4>
                                  <p>
                                      Para cada ventana disponible, verás un botón que dice <strong>"Elegir Canal…"</strong>. Al hacer clic, se abrirá un diálogo con varias opciones:
                                  </p>
                                  <ul className="list-disc pl-6 space-y-2">
                                      <li>
                                          <strong>Pestaña "Canales":</strong> Aquí encontrarás una lista de canales de TV disponibles 24/7. Puedes usar la barra de búsqueda para encontrar uno rápidamente. Junto a cada canal verás un indicador de estado:
                                          <ul className="list-decimal pl-6 mt-1">
                                              <li><span className="text-green-500 font-bold">Verde:</span> El canal está activo y funcionando.</li>
                                              <li><span className="text-red-500 font-bold">Rojo:</span> El canal está inactivo o podría no funcionar.</li>
                                              <li><span className="text-gray-500 font-bold">Gris:</span> Estado desconocido, podría funcionar o no.</li>
                                          </ul>
                                      </li>
                                      <li><strong>Pestaña "Eventos":</strong> Una agenda con los partidos y eventos del día. Puedes buscar por equipo, liga o deportista. Los eventos también muestran su estado: "En Vivo", "Próximo" o "Finalizado".</li>
                                      <li>
                                          <strong>Pegar Enlace:</strong> Si tienes un enlace de video compatible (M3U8, MPD, etc.), puedes pegarlo directamente usando el botón <strong className="text-foreground">"Pega aqui tu enlace!"</strong> que aparece al principio de la lista de canales.
                                      </li>
                                  </ul>
                                  <p>
                                      Simplemente haz clic en <strong>"Seleccionar"</strong> en el canal o evento que desees para asignarlo a la ventana activa.
                                  </p>

                                  <h4 className="font-semibold text-foreground pt-2">Paso 3: Gestiona tus Vistas</h4>
                                  <p>
                                      Una vez que has asignado contenido a una vista, tienes varias herramientas para gestionarla:
                                  </p>
                                  <ul className="list-disc pl-6 space-y-1">
                                      <li><strong>Flechas (Arriba/Abajo):</strong> Reordena las ventanas a tu gusto.</li>
                                      <li><strong>Botón "X":</strong> Limpia la selección de una ventana para dejarla vacía.</li>
                                      <li><strong>Botón de Recarga (en la página de visualización):</strong> Si una transmisión se congela o falla, usa este botón para recargarla sin afectar las demás.</li>
                                  </ul>

                                  <h4 className="font-semibold text-foreground pt-2">Paso 4: Inicia la Sala de Control</h4>
                                  <p>
                                      Cuando tengas todo listo, presiona el gran botón <strong>"Iniciar Vista"</strong>. Serás redirigido a la página de visualización donde verás todas tus selecciones en la cuadrícula que configuraste.
                                  </p>

                                  <h4 className="font-semibold text-foreground pt-2">Configuraciones Avanzadas (Menú <Settings className="inline-block h-4 w-4" />)</h4>
                                  <p>
                                      Personaliza aún más tu experiencia desde el menú de Configuración:
                                  </p>
                                  <ul className="list-disc pl-6 space-y-1">
                                      <li><strong>Bordes:</strong> Ajusta el grosor y el color del espacio entre las ventanas de video para una mejor separación visual.</li>
                                      <li><strong>Chat:</strong> Activa o desactiva el chat en vivo global, disponible en la página de visualización.</li>
                                      <li><strong>Eventos:</strong> Controla cómo se agrupan los eventos en la lista. Puedes agruparlos por competición (F1, NBA, etc.) o verlos todos juntos.</li>
                                       <li><strong>Programar Selección:</strong> ¿Un partido empieza más tarde? Puedes programar un cambio de diseño para una fecha y hora específicas. La aplicación cambiará automáticamente las ventanas y canales a la hora programada.</li>
                                  </ul>
                                   <h4 className="font-semibold text-foreground pt-2">Consejos Útiles</h4>
                                  <ul className="list-disc pl-6 space-y-1">
                                      <li>La aplicación guarda automáticamente tus selecciones de canales y configuraciones, ¡no necesitas guardarlas manualmente!</li>
                                       <li>Si un video no carga, prueba recargando la vista específica o consulta la sección de "Errores" para soluciones comunes como cambiar el DNS.</li>
                                       <li>Para cualquier problema o sugerencia, no dudes en usar la opción de "Contacto".</li>
                                  </ul>
                              </div>
                          </DialogContent>
                      </Dialog>
                     <Dialog>
                          <DialogTrigger asChild>
                              <Button variant="outline" className="justify-start w-full">
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Errores
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                  <DialogTitle>Solución de Errores Comunes</DialogTitle>
                              </DialogHeader>
                              <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6 text-sm text-muted-foreground">
                                <p>
                                    A continuación, te presentamos una guía detallada para resolver los problemas más frecuentes que podrías encontrar al intentar reproducir videos. Sigue estos pasos en orden para maximizar las chances de éxito.
                                </p>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-foreground">1. Configurar un DNS público (Cloudflare o Google)</h4>
                                    <p>
                                        <strong>El Problema:</strong> Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios o servidores de video a través de su DNS. Esto provoca que el video nunca cargue y veas una pantalla negra o un error de conexión.
                                    </p>
                                    <p>
                                        <strong>La Solución:</strong> Cambiar el DNS de tu dispositivo o router a uno público como el de Cloudflare (<a href="https://one.one.one.one" target="_blank" rel="noopener noreferrer" className="text-primary underline">1.1.1.1</a>) o Google (8.8.8.8) puede saltarse estas restricciones. Estos servicios son gratuitos, rápidos y respetan tu privacidad. Este es el método más efectivo y soluciona la mayoría de los casos.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-foreground">2. Instalar una Extensión de Reproductor de Video</h4>
                                    <p>
                                        <strong>El Problema:</strong> Algunos streams de video utilizan formatos modernos como M3U8 o MPD que no todos los navegadores soportan de forma nativa. Si el navegador no sabe cómo "leer" el formato, el video no se reproducirá.
                                    </p>
                                    <p>
                                        <strong>La Solución:</strong> Instalar una extensión como <a href="https://chromewebstore.google.com/detail/reproductor-mpdm3u8m3uepg/opmeopcambhfimffbomjgemehjkbbmji?hl=es" target="_blank" rel="noopener noreferrer" className="text-primary underline">"Reproductor MPD/M3U8/M3U/EPG"</a> (para Chrome/Edge) le da a tu navegador las herramientas necesarias para decodificar y reproducir estos formatos. Actúa como un "traductor" que le enseña a tu navegador a manejar estos videos.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-foreground">3. Cambiar de Navegador</h4>
                                    <p>
                                        <strong>El Problema:</strong> A veces, las configuraciones específicas de un navegador, una actualización reciente o una extensión conflictiva pueden impedir la reproducción.
                                    </p>
                                    <p>
                                        <strong>La Solución:</strong> Probar con un navegador diferente es una forma rápida de descartar problemas locales. Recomendamos usar las versiones más recientes de <strong>Google Chrome</strong>, <strong>Mozilla Firefox</strong> o <strong>Microsoft Edge</strong>, ya que suelen tener la mejor compatibilidad con tecnologías de video web.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-foreground">4. Desactivar Bloqueadores de Anuncios (Adblockers)</h4>
                                    <p>
                                        <strong>El Problema:</strong> Los bloqueadores de anuncios son muy útiles, pero a veces pueden ser demasiado agresivos. Pueden bloquear no solo los anuncios, sino también los scripts o reproductores de video necesarios para que la transmisión funcione.
                                    </p>
                                    <p>
                                        <strong>La Solución:</strong> Intenta desactivar tu Adblocker (como AdBlock, uBlock Origin, etc.) temporalmente para este sitio web. La mayoría de estas extensiones te permiten añadir sitios a una "lista blanca" para que no actúen sobre ellos. Recarga la página después de desactivarlo.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-foreground">5. Optimizar para Escritorio</h4>
                                    <p>
                                        <strong>El Problema:</strong> La aplicación está diseñada y optimizada para la experiencia en una computadora de escritorio o portátil. Los dispositivos móviles (celulares, tabletas) tienen limitaciones de hardware y software que pueden causar errores de reproducción o problemas de rendimiento.
                                    </p>
                                    <p>
                                        <strong>La Solución:</strong> Para una experiencia más estable y fluida, recomendamos encarecidamente usar la plataforma en una computadora. Esto asegura que haya suficientes recursos para manejar múltiples transmisiones de video simultáneamente.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-semibold text-foreground">6. Reiniciar el Dispositivo y la Red</h4>
                                    <p>
                                        <strong>El Problema:</strong> Problemas temporales de software, caché acumulada o fallos en la conexión de red pueden impedir que el contenido cargue correctamente.
                                    </p>
                                    <p>
                                        <strong>La Solución:</strong> El clásico "apagar y volver a encender". Un reinicio rápido de tu computadora y de tu router puede solucionar problemas transitorios de red, memoria o software que podrían estar afectando la reproducción de video.
                                    </p>
                                </div>
                              </div>
                          </DialogContent>
                      </Dialog>
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
          {urlsToDisplay.map((item) => {
            const visualOrder = viewOrder.indexOf(item.originalIndex);
            
            const windowClasses: string[] = ["overflow-hidden", "relative", "bg-background"];
            if (!item.url) {
                windowClasses.push("bg-red-500", "flex", "items-center", "justify-center", "text-destructive-foreground", "font-bold");
            }
             if (numIframes === 3) {
              // Special layout for 3 windows on desktop
              windowClasses.push(
                'md:col-span-1 md:row-span-1',
                visualOrder === 0 ? 'md:col-span-2' : ''
              );
            }
            
            let iframeSrc = item.url 
              ? `${item.url}${item.url.includes('?') ? '&' : '?'}reload=${item.reloadKey}`
              : '';

            if (iframeSrc.includes("youtube-nocookie.com")) {
                iframeSrc += `&autoplay=1`;
            }

            return (
              <div
                key={`${item.originalIndex}-${item.reloadKey}`}
                className={cn(windowClasses, getOrderClass(visualOrder + 1))}
              >
                {item.url ? (
                  <iframe
                    src={iframeSrc}
                    title={`Stream ${item.originalIndex + 1}`}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
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
